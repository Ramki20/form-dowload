import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  flush,
} from '@angular/core/testing';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  Validators,
} from '@angular/forms';
import { of, throwError } from 'rxjs';
import { PreClosingSetAsideInfoCardComponent } from './pre-closing-set-aside-info-card.component';
import { PreClosingRequestDataService } from '../../services/pre-closing-request-data/pre-closing-request-data.service';
import { resources } from '../../resources/resources';
import {
  SetAsideInput,
  SetAsideFormData,
} from '../../interfaces/pre-close.model';
import { DirectLoan } from '../../interfaces/loanData.interface';
import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';


@Component({ selector: 'error-growl', template: '', standalone: true })
class MockErrorGrowlComponent {
  @Input() formErrors: any;
}

@Component({
  selector: 'fsa-money-input',
  template: '',
  inputs: ['id', 'formControlName', 'max_length', 'aria-describedby'],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FSAMoneyInputStubComponent),
      multi: true,
    },
  ],
})
class FSAMoneyInputStubComponent implements ControlValueAccessor {
  @Input() control: any;
  writeValue(value: any): void {}
  registerOnChange(fn: any): void {}
  registerOnTouched(fn: any): void {}
  setDisabledState?(isDisabled: boolean): void {}
}

class MockPreClosingRequestDataService {
  selectedSetAsideData$ = of<{
    loan: DirectLoan | null;
    setAsideInput: SetAsideInput | null;
    formData: SetAsideFormData | null;
  }>({ loan: null, setAsideInput: null, formData: null });

  saveSetAsideInfo(formData: SetAsideFormData) {
    return Promise.resolve({ success: true });
  }
}

describe('PreClosingSetAsideInfoCardComponent', () => {
  let component: PreClosingSetAsideInfoCardComponent;
  let fixture: ComponentFixture<PreClosingSetAsideInfoCardComponent>;
  let mockService: MockPreClosingRequestDataService;

  // Mock data
  const mockDirectLoan: DirectLoan = {
    id: 1,
    fundCode: 123,
    loanNumber: '123456',
    loanRelationshipTypeCode: 'PR',
    loanClosingDate: '2024-01-01',
    unpaidPrincipalAmount: 10000,
    totalUnpaidInterestAmount: 500,
    totalLoanScheduledAmount: 0,
    loanAmount: 20000,
    loanType: 'FO',
    nextInstallmentAmount: 1000,
    loanExpirationDate: new Date(2030, 0, 1),
    lastCashCreditDate: new Date(2024, 0, 1),
    newLoanNumber: 0,
    debtSettlementDescription: '',
    loanWriteOffDescription: '',
    unpaidInterestAmount: 500,
  };

  const mockSetAsideInput: SetAsideInput = {
    disasterCode: 'M1234',
    setAsideAmount: 5000,
    paymentAmountAfterInstallment: 100,
    installmentDates: ['01/01/2025'],
    setAsideType: 'DSA',
    nextInstallmentDueDate: '2025-01-01',
    loanMaturityDate: '2030-01-01',
    loanTotalInterestAmount: 500,
  };

  const mockFormData: SetAsideFormData = {
    setAsideType: 'DSA',
    disasterCode: 'M1234',
    approvalDate: '2024-01-01',
    installmentDate: '01/01/2025',
    setAsideAmount: 5000,
    paymentAfterInstallment: 100,
  };

  beforeEach(async () => {
    mockService = new MockPreClosingRequestDataService();

    await TestBed.configureTestingModule({
      declarations: [PreClosingSetAsideInfoCardComponent],
      imports: [ReactiveFormsModule, FSAMoneyInputStubComponent, MockErrorGrowlComponent],
      providers: [
        FormBuilder,
        { provide: PreClosingRequestDataService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PreClosingSetAsideInfoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.setAsideForm).toBeDefined();
  });

  it('should initialize resources correctly', () => {
    expect(component.resources).toBe(resources);
  });

  it('should initialize isDisabled to true', () => {
    expect(component.isDisabled).toBe(true);
  });

  it('should initialize isSaving to false', () => {
    expect(component.isSaving).toBe(false);
  });

  it('should initialize installmentDates with default option', () => {
    expect(component.installmentDates).toEqual([
      { value: '', label: 'Select a Date' },
    ]);
  });

  it('should initialize form with disabled controls and validators', () => {
    const controls = component.setAsideForm.controls;
    expect(controls['setAsideType'].disabled).toBe(true);
    expect(controls['setAsideType'].hasValidator(Validators.required)).toBe(
      true
    );
    expect(controls['disasterCode'].disabled).toBe(true);
    expect(controls['approvalDate'].disabled).toBe(true);
    expect(controls['installmentDate'].disabled).toBe(true);
    expect(controls['installmentDate'].hasValidator(Validators.required)).toBe(
      true
    );
    expect(controls['setAsideAmount'].disabled).toBe(true);
    expect(controls['setAsideAmount'].hasValidator(Validators.required)).toBe(
      true
    );
    controls['setAsideAmount'].enable();
    controls['setAsideAmount'].setValue(-1);
    expect(controls['setAsideAmount'].hasError('min')).toBe(true);
    controls['setAsideAmount'].setValue(0.01);
    expect(controls['setAsideAmount'].hasError('min')).toBe(false);
    controls['setAsideAmount'].disable();
    expect(controls['paymentAfterInstallment'].disabled).toBe(true);
  });

  describe('getters', () => {
    it('should return setAsideAmountControl', () => {
      expect(component.setAsideAmountControl).toBe(
        component.setAsideForm.get('setAsideAmount')
      );
    });

    it('should return paymentAfterInstallmentControl', () => {
      expect(component.paymentAfterInstallmentControl).toBe(
        component.setAsideForm.get('paymentAfterInstallment')
      );
    });
  });

  describe('ngOnInit', () => {
    it('should disable form and reset when no loan is selected', fakeAsync(() => {
      mockService.selectedSetAsideData$ = of({
        loan: null,
        setAsideInput: null,
        formData: null,
      });

      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(component.isDisabled).toBe(true);
      expect(component.setAsideForm.disabled).toBe(true);
      expect(component.setAsideForm.value).toEqual({
        setAsideType: null,
        disasterCode: null,
        approvalDate: null,
        installmentDate: null,
        setAsideAmount: null,
        paymentAfterInstallment: null,
      });
      expect(component.installmentDates).toEqual([
        { value: '', label: 'Select a Date' },
      ]);
      flush();
    }));

    it('should enable form and patch values when loan and setAsideInput are provided', fakeAsync(() => {
      mockService.selectedSetAsideData$ = of({
        loan: mockDirectLoan,
        setAsideInput: mockSetAsideInput,
        formData: null,
      });

      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(component.isDisabled).toBe(false);
      expect(component.setAsideForm.enabled).toBe(true);
      expect(component.setAsideForm.value).toEqual({
        setAsideType: 'DSA',
        disasterCode: '',
        approvalDate: '2024-01-01',
        installmentDate: '01/01/2025',
        setAsideAmount: 5000,
        paymentAfterInstallment: 100,
      });
      expect(component.installmentDates.length).toBeGreaterThan(1);
      expect(
        component.setAsideForm
          .get('disasterCode')
          ?.hasValidator(Validators.required)
      ).toBe(true);
      const disasterCodeControl = component.setAsideForm.get('disasterCode');
      disasterCodeControl?.setValue('invalid');
      expect(disasterCodeControl?.hasError('pattern')).toBe(true);
      disasterCodeControl?.setValue('M1234');
      expect(disasterCodeControl?.hasError('pattern')).toBe(false);
      flush();
    }));

    it('should use existing setAsideAmount if set', fakeAsync(() => {
      component.setAsideForm.enable();
      component.setAsideForm.patchValue({ setAsideAmount: 6000 });
      mockService.selectedSetAsideData$ = of({
        loan: mockDirectLoan,
        setAsideInput: mockSetAsideInput,
        formData: null,
      });

      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(component.setAsideForm.get('setAsideAmount')?.value).toBe(6000);
      flush();
    }));
  });

  describe('updateDisasterCodeValidators', () => {
    beforeEach(() => {
      component.setAsideForm.enable();
    });

    it('should set disasterCode to Z2024 and disable control for DBSA', () => {
      component.updateDisasterCodeValidators('DBSA');

      const disasterCodeControl = component.setAsideForm.get('disasterCode');
      expect(disasterCodeControl?.value).toBe('Z2024');
      expect(disasterCodeControl?.disabled).toBe(true);
      expect(disasterCodeControl?.validator).toBeNull();
    });

    it('should enable disasterCode with validators for DSA', () => {
      component.updateDisasterCodeValidators('DSA');

      const disasterCodeControl = component.setAsideForm.get('disasterCode');
      expect(disasterCodeControl?.value).toBe('');
      expect(disasterCodeControl?.enabled).toBe(true);
      expect(disasterCodeControl?.hasValidator(Validators.required)).toBe(true);
      disasterCodeControl?.setValue('invalid');
      expect(disasterCodeControl?.hasError('pattern')).toBe(true);
      disasterCodeControl?.setValue('M1234');
      expect(disasterCodeControl?.hasError('pattern')).toBe(false);
    });
  });

  describe('setInstallmentDateOptions', () => {
    it('should generate installment dates based on input dates', () => {
      const nextDueDate = new Date(2024, 11, 31);
      const maturityDate = new Date(2027, 0, 1);
      const today = new Date(2024, 5, 1);

      component.setInstallmentDateOptions(nextDueDate, maturityDate, today);

      expect(component.installmentDates).toContainEqual({
        value: '12/31/2023',
        label: '12/31/2023',
      });
      expect(component.installmentDates).toContainEqual({
        value: '12/31/2024',
        label: '12/31/2024',
      });
      expect(component.installmentDates).toContainEqual({
        value: '12/31/2025',
        label: '12/31/2025',
      });
      expect(component.installmentDates.length).toBe(4);
    });

    it('should reset installmentDate if current value is invalid', () => {
      component.setAsideForm.enable();
      component.setAsideForm.get('installmentDate')?.setValue('invalid-date');
      const nextDueDate = new Date(2024, 11, 31);
      const maturityDate = new Date(2027, 0, 1);
      const today = new Date(2024, 5, 1);

      component.setInstallmentDateOptions(nextDueDate, maturityDate, today);

      expect(component.setAsideForm.get('installmentDate')?.value).toBe(
        '12/31/2023'
      );
    });

    it('should not reset installmentDate if current value is valid', () => {
      component.setAsideForm.enable();
      component.setAsideForm.get('installmentDate')?.setValue('12/31/2023');
      const nextDueDate = new Date(2024, 11, 31);
      const maturityDate = new Date(2027, 0, 1);
      const today = new Date(2024, 5, 1);

      component.setInstallmentDateOptions(nextDueDate, maturityDate, today);

      expect(component.setAsideForm.get('installmentDate')?.value).toBe(
        '12/31/2023'
      );
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      component.setAsideForm.enable();
      component.isDisabled = false;
    });

    it('should set formErrors and not call saveSetAsideInfo on invalid form', fakeAsync(() => {
      const saveSpy = jest.spyOn(mockService, 'saveSetAsideInfo');
      component.setAsideForm.patchValue({
        setAsideType: '',
        disasterCode: '',
        approvalDate: '',
        installmentDate: '',
        setAsideAmount: 0,
        paymentAfterInstallment: null,
      });

      try {
        component.onSubmit();
        tick(500);
        flush();
      } catch (e) {}
      expect(saveSpy).not.toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
      expect(component.formErrors).toEqual([
        'Please correct the errors in the form.',
      ]);
    }));
  });
  describe('validation methods', () => {
    beforeEach(() => {
      component.setAsideForm.enable();
    });


    it('should validate disasterCode correctly for DSA', () => {
      component.setAsideForm.patchValue({ setAsideType: 'DSA', disasterCode: '' });
      component.validateDisasterCode();
      expect(component.showDisasterCodeError).toBe(true);
      expect(component.disasterCodeErrorMessage).toBe('The Disaster Designation Code is required.');


      component.setAsideForm.patchValue({ disasterCode: 'X1234' });
      component.validateDisasterCode();
      expect(component.showDisasterCodeError).toBe(true);
      expect(component.disasterCodeErrorMessage).toContain('The Disaster Designation Code format is invalid');


      component.setAsideForm.patchValue({ disasterCode: 'M1234' });
      component.validateDisasterCode();
      expect(component.showDisasterCodeError).toBe(false);
      expect(component.disasterCodeErrorMessage).toBe('');
    });


    it('should not validate disasterCode for DBSA', () => {
      component.setAsideForm.patchValue({ setAsideType: 'DBSA', disasterCode: '' });
      component.validateDisasterCode();
      expect(component.showDisasterCodeError).toBe(false);
      expect(component.disasterCodeErrorMessage).toBe('');
    });


    it('should validate installmentDate correctly', () => {
      component.setAsideForm.patchValue({ installmentDate: '' });
      component.validateInstallmentDate();
      expect(component.showInstallmentDateError).toBe(true);
      expect(component.installmentDateErrorMessage).toBe('Installment Date is required.');


      component.setAsideForm.patchValue({ installmentDate: '01/01/2025' });
      component.validateInstallmentDate();
      expect(component.showInstallmentDateError).toBe(false);
      expect(component.installmentDateErrorMessage).toBe('');
    });


    it('should validate setAsideAmount correctly', () => {
      component.setAsideForm.patchValue({ setAsideAmount: null });
      component.validateSetAsideAmount();
      expect(component.showSetAsideAmountError).toBe(true);
      expect(component.setAsideAmountErrorMessage).toBe('The Set-Aside Amount is required.');


      component.setAsideForm.patchValue({ setAsideAmount: 0 });
      component.validateSetAsideAmount();
      expect(component.showSetAsideAmountError).toBe(true);
      expect(component.setAsideAmountErrorMessage).toBe('Set-Aside Amount must be greater than zero.');


      component.setAsideForm.patchValue({ setAsideAmount: 5000 });
      component.validateSetAsideAmount();
      expect(component.showSetAsideAmountError).toBe(false);
      expect(component.setAsideAmountErrorMessage).toBe('');
    });


    it('should validate paymentAfterInstallment correctly', () => {
      component.setAsideForm.patchValue({ paymentAfterInstallment: null });
      component.validatePaymentAfterInstallment();
      expect(component.showPaymentAfterInstallmentError).toBe(true);
      expect(component.paymentAfterInstallmentErrorMessage).toBe('The Payment After Installment Date is required.');


      component.setAsideForm.patchValue({ paymentAfterInstallment: 100 });
      component.validatePaymentAfterInstallment();
      expect(component.showPaymentAfterInstallmentError).toBe(false);
      expect(component.paymentAfterInstallmentErrorMessage).toBe('');
    });
  });
});
