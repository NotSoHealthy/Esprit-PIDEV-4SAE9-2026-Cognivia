import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Router } from '@angular/router';

@Component({
    selector: 'app-memory-game-view',
    standalone: true,
    imports: [CommonModule, NzButtonModule, NzIconModule],
    templateUrl: './memory-game-view.component.html',
    styleUrls: ['./memory-game-view.component.css']
})
export class MemoryGameViewComponent implements OnInit {

    isGameStarted: boolean = false;

    constructor(private router: Router) { }

    ngOnInit(): void {
    }

    startGame(): void {
        // Reveal the iframe which will trigger the Unity WebGL download/initialization
        this.isGameStarted = true;
    }

    goBack(): void {
        // Navigate back to the patient dashboard
        this.router.navigate(['/profile']);
    }

}
