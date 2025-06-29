import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { distinctUntilChanged, take } from 'rxjs/operators';
import { DirectLoan } from '../../interfaces/loanData.interface';
import { PreClosingRequestDataService } from '../../services/pre-closing-request-data/pre-closing-request-data.service';
import { resources } from '../../resources/resources';
import {
  SetAsideInput,
  SetAsideFormData,
} from '../../interfaces/pre-close.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-pre-closing-set-aside-info-card',
  standalone: false,
  templateUrl: './pre-closing-set-aside-info-card.component.html',
  styleUrls: ['./pre-closing-set-aside-info-card.component.scss'],
})
export class PreClosingSetAsideInfoCardComponent implements OnInit {
  resources = resources;
  selectedSetAsideData$!: Observable<{
    loan: DirectLoan | null;
    setAsideInput: SetAsideInput | null;
    formData: SetAsideFormData | null;
  }>;
  isDisabled: boolean = true;
  isSaving: boolean = false;
  setAsideForm: FormGroup;
  installmentDates: { value: string; label: string }[] = [
    { value: '', label: 'Select a Date' },
  ];
  formErrors: string[] = [];

  showDisasterCodeError: boolean = false;
  disasterCodeErrorMessage: string = '';
  showInstallmentDateError: boolean = false;
  installmentDateErrorMessage: string = '';
  showSetAsideAmountError: boolean = false;
  setAsideAmountErrorMessage: string = '';
  showPaymentAfterInstallmentError: boolean = false;
  paymentAfterInstallmentErrorMessage: string = '';

  constructor(
    private preClosingRequestDataService: PreClosingRequestDataService,
    private fb: FormBuilder
  ) {
    this.setAsideForm = this.fb.group({
      setAsideType: [{ value: '', disabled: true }, Validators.required],
      disasterCode: [{ value: '', disabled: true }],
      approvalDate: [{ value: '', disabled: true }],
      installmentDate: [{ value: '', disabled: true }, Validators.required],
      setAsideAmount: [
        { value: null, disabled: true },
        [Validators.required, Validators.min(0.01)],
      ],
      paymentAfterInstallment: [{ value: null, disabled: true }],
    });
  }

  get setAsideAmountControl(): FormControl {
    return this.setAsideForm.get('setAsideAmount') as FormControl;
  }

  get paymentAfterInstallmentControl(): FormControl {
    return this.setAsideForm.get('paymentAfterInstallment') as FormControl;
  }

  ngOnInit() {
    this.selectedSetAsideData$ = this.preClosingRequestDataService.selectedSetAsideData$;
    this.selectedSetAsideData$
      .pipe(
        distinctUntilChanged(
          (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
        )
      )
      .subscribe(({ loan, setAsideInput, formData }) => {
        this.isDisabled = !loan;
        this.formErrors = [];
        if (loan && setAsideInput && !this.isSaving) {
          this.setAsideForm.enable();
          const currentValues = this.setAsideForm.getRawValue();
          const disasterCode =
            currentValues.setAsideType === 'DBSA'
              ? 'Z2024'
              : currentValues.disasterCode || setAsideInput.disasterCode || '';
          this.setInstallmentDateOptions(
            setAsideInput.nextInstallmentDueDate
              ? new Date(setAsideInput.nextInstallmentDueDate)
              : new Date(),
            setAsideInput.loanMaturityDate
              ? new Date(setAsideInput.loanMaturityDate)
              : new Date(),
            new Date()
          );
          this.setAsideForm.patchValue(
            {
              approvalDate: currentValues.approvalDate || loan.loanClosingDate || '',
              disasterCode,
              setAsideAmount:
                currentValues.setAsideAmount ??
                setAsideInput.setAsideAmount ??
                null,
              paymentAfterInstallment:
                currentValues.paymentAfterInstallment ??
                setAsideInput.paymentAmountAfterInstallment ??
                null,
              installmentDate:
                currentValues.installmentDate ||
                setAsideInput.installmentDates?.[0] ||
                '',
              setAsideType: currentValues.setAsideType || setAsideInput.setAsideType || 'DSA',
            },
            { emitEvent: false }
          );
          this.updateDisasterCodeValidators(currentValues.setAsideType || setAsideInput.setAsideType || 'DSA');
        } else if (!loan) {
          this.setAsideForm.reset();
          this.setAsideForm.disable();
          this.installmentDates = [{ value: '', label: 'Select a Date' }];
        }
        this.setAsideForm.updateValueAndValidity();
      });

    this.setAsideForm.get('setAsideType')?.valueChanges.subscribe((value) => {
      this.updateDisasterCodeValidators(value);
      this.validateDisasterCode();
    });

    this.setAsideForm.get('disasterCode')?.valueChanges.subscribe(() => {
      this.validateDisasterCode();
    });

    this.setAsideForm.get('installmentDate')?.valueChanges.subscribe(() => {
      this.validateInstallmentDate();
    });

    this.setAsideForm.get('setAsideAmount')?.valueChanges.subscribe(() => {
      this.validateSetAsideAmount();
    });

    this.setAsideForm.get('paymentAfterInstallment')?.valueChanges.subscribe(() => {
      this.validatePaymentAfterInstallment();
    });
  }

  updateDisasterCodeValidators(setAsideType: string) {
    const disasterCodeControl = this.setAsideForm.get('disasterCode');
    if (setAsideType === 'DBSA') {
      disasterCodeControl?.setValue('Z2024', { emitEvent: false });
      disasterCodeControl?.disable();
      disasterCodeControl?.clearValidators();
      this.showDisasterCodeError = false;
      this.disasterCodeErrorMessage = '';
    } else if (setAsideType === 'DSA') {
      disasterCodeControl?.setValue('', { emitEvent: false });
      if (!this.isSaving) {
        disasterCodeControl?.enable();
      }
      disasterCodeControl?.setValidators([
        Validators.required,
        Validators.pattern(/^[MSNQ]\d{4}$/),
      ]);
    }
    disasterCodeControl?.updateValueAndValidity();
    this.setAsideForm.updateValueAndValidity();
  }

  setInstallmentDateOptions(
    nextDueDate: Date,
    maturityDate: Date,
    today: Date
  ): void {
    const currentDate = this.setAsideForm.get('installmentDate')?.value;
    this.installmentDates = [{ value: '', label: 'Select a Date' }];
    let count = 0;
    let year = today.getFullYear();
    nextDueDate.setFullYear(year);
    const lastYearNeededOffset = 2;
    const countCutoff = 3;
    const lastYearNeeded = maturityDate.getFullYear() - lastYearNeededOffset;
    const monthDay = `${(nextDueDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${nextDueDate.getDate().toString().padStart(2, '0')}/`;
    if (today <= nextDueDate) {
      year = year - 1;
    }
    while (year <= lastYearNeeded && count < countCutoff) {
      const dateStr = `${monthDay}${year}`;
      this.installmentDates.push({
        value: dateStr,
        label: new Date(dateStr).toLocaleDateString('en-US'),
      });
      year += 1;
      count += 1;
    }
    if (currentDate && this.installmentDates.some((date) => date.value === currentDate)) {
      this.setAsideForm.get('installmentDate')?.setValue(currentDate, { emitEvent: false });
    } else if (currentDate && !this.installmentDates.some((date) => date.value === currentDate)) {
      this.setAsideForm.get('installmentDate')?.setValue(this.installmentDates[1]?.value || '', { emitEvent: true });
    }
  }

  validateDisasterCode() {
    const ddcRegex = /^[MSNQ]\d{4}$/;
    const ddcInput: string = this.setAsideForm.value.disasterCode;
    this.showDisasterCodeError = false;
    this.disasterCodeErrorMessage = '';
    if (this.setAsideForm.value.setAsideType === 'DSA') {
      if (!ddcInput) {
        this.showDisasterCodeError = true;
        this.disasterCodeErrorMessage = 'The Disaster Designation Code is required.';
      } else if (!ddcRegex.test(ddcInput)) {
        this.showDisasterCodeError = true;
        this.disasterCodeErrorMessage =
          'The Disaster Designation Code format is invalid, it must be in the following format Axxxx where A must ' +
          'be M, S, N, or Q and xxxx is a four digit number.  M=Presidential, S=Secretarial, N=Administrator ' +
          'Physical Loss, Q=Quarantine';
      }
    }
  }

  validateInstallmentDate() {
    const value = this.setAsideForm.value.installmentDate;
    this.showInstallmentDateError = false;
    this.installmentDateErrorMessage = '';
    if (!value) {
      this.showInstallmentDateError = true;
      this.installmentDateErrorMessage = 'Installment Date is required.';
    }
  }

  validateSetAsideAmount() {
    const value = this.setAsideForm.value.setAsideAmount;
    this.showSetAsideAmountError = false;
    this.setAsideAmountErrorMessage = '';
    if (value === null || value === '' || value === '.') {
      this.showSetAsideAmountError = true;
      this.setAsideAmountErrorMessage = 'The Set-Aside Amount is required.';
    } else if (value <= 0) {
      this.showSetAsideAmountError = true;
      this.setAsideAmountErrorMessage = 'Set-Aside Amount must be greater than zero.';
    }
  }

  validatePaymentAfterInstallment() {
    const value = this.setAsideForm.value.paymentAfterInstallment;
    this.showPaymentAfterInstallmentError = false;
    this.paymentAfterInstallmentErrorMessage = '';
    if (value === null || value === '' || value === '.') {
      this.showPaymentAfterInstallmentError = true;
      this.paymentAfterInstallmentErrorMessage = 'The Payment After Installment Date is required.';
    }
  }

  async onSubmit() {
    this.setAsideForm.markAllAsTouched();
    this.formErrors = [];

    this.validateDisasterCode();
    this.validateInstallmentDate();
    this.validateSetAsideAmount();
    this.validatePaymentAfterInstallment();

    if (this.setAsideForm.valid && !this.isDisabled) {
      this.isSaving = true;
      this.setAsideForm.disable();
      try {
        const formData: SetAsideFormData = this.setAsideForm.getRawValue();
        const response = await this.preClosingRequestDataService.saveSetAsideInfo(formData);
        this.formErrors = [];
        this.showDisasterCodeError = false;
        this.disasterCodeErrorMessage = '';
        this.showInstallmentDateError = false;
        this.installmentDateErrorMessage = '';
        this.showSetAsideAmountError = false;
        this.setAsideAmountErrorMessage = '';
        this.showPaymentAfterInstallmentError = false;
        this.paymentAfterInstallmentErrorMessage = '';
      } catch (error: any) {
        console.error('Save failed:', error);
        this.formErrors.push(error.message || 'An error occurred while saving.');
      } finally {
        this.isSaving = false;
        this.preClosingRequestDataService.selectedLoan$.pipe(take(1)).subscribe((loan) => {
          if (loan && !this.isDisabled) {
            this.setAsideForm.enable();
            this.updateDisasterCodeValidators(this.setAsideForm.get('setAsideType')?.value || 'DSA');
          } else {
            this.setAsideForm.disable();
          }
        });
      }
    } else {
      console.error('Form is invalid:', this.setAsideForm.errors, this.setAsideForm.value);
      if (!this.formErrors.length) {
        this.formErrors.push('Please correct the errors in the form.');
      }
    }
  }
}

