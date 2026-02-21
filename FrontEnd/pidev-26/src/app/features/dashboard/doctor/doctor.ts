import { Component } from '@angular/core';
import { TasksPage } from '../../tasks/tasks.page';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doctor',
  imports: [CommonModule, TasksPage],
  templateUrl: './doctor.html',
  styleUrl: './doctor.css',
})
export class Doctor {

}
