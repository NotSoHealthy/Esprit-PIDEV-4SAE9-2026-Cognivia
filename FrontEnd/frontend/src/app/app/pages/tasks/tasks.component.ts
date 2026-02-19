import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Task } from '../../models/task';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {

  tasks: Task[] = [];

  form: Task = {
    patientId: 12,
    userId: 5,
    task: '',
    taskType: 'MEDICATION',
    dueAt: '2026-02-14T08:00:00'
  };

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.taskService.getAll().subscribe(res => this.tasks = res);
  }

  create() {
    this.taskService.create(this.form).subscribe(() => {
      this.form.task = '';
      this.load();
    });
  }

  toggleDone(t: Task) {
    this.taskService.markDone(t.id!, !(t.isDone ?? false)).subscribe(() => this.load());
  }

  remove(id: number) {
    this.taskService.delete(id).subscribe(() => this.load());
  }
}
