import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly languageService = inject(LanguageService);
  protected readonly title = signal('pidev-26');

  ngOnInit(): void {
    this.languageService.initLanguage();
  }
}
