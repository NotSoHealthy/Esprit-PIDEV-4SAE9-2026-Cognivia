import { Component } from '@angular/core';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

@Component({
  selector: 'app-medication-empty',
  standalone: true,
  imports: [NzEmptyModule],
  template: `
    <div style="padding: 48px 16px; display: flex; justify-content: center;">
      <nz-empty nzNotFoundContent="Medication page is empty for now"></nz-empty>
    </div>
  `
})
export class MedicationEmpty {}
