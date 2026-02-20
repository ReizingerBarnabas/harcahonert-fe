import { ChangeDetectorRef, Component, OnInit, OnDestroy, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { FormsModule } from '@angular/forms';


interface Solution {
  received: boolean;
  message: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ButtonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  encapsulation: ViewEncapsulation.None
})

export class AppComponent implements OnInit, OnDestroy {
  public question: any;
  public questionId: number = 0;
  public isStarted: boolean = false;
  public solution: Solution | null = null;
  public counter: number = 0;
  public clickedButton1: boolean = false;
  public clickedButton2: boolean = false;
  public clickedButton3: boolean = false;
  public correctAnswer1: boolean = false;
  public correctAnswer2: boolean = false;
  public correctAnswer3: boolean = false;
  isPlayButtonPressed: boolean = false;
  isAllConnected: boolean = false;
  socket!: Socket;
  roomId: string = '';
  message: string = '';
  joined = false;
  constructor(private http: HttpClient, private changeDetector: ChangeDetectorRef) { }
  ngOnInit() {
    this.connectToGroup();
    setTimeout(() => {
      this.changeDetector.markForCheck();
    }, 1000);
  }

  ngOnDestroy() {
    this.socket.disconnect();
  }

  getQuestion() {
    this.changeDetector.markForCheck();
    this.questionId++;
    this.isPlayButtonPressed = true;
    

    this.http.get(`http://localhost:3000/api/question/${this.questionId}`).subscribe({
      next: (res) => this.question = res,
      error: (err) => {
        console.error('Hiba történt:', err);
        this.question = null;
      }
    });
  }

  connectToGroup(): void {
    this.socket = io('http://localhost:3000');

    this.socket.on('roomCreated', (data: any) => {
      this.roomId = data.roomId;
      this.message = `Csoport létrehozva! Azonosító: ${this.roomId}`;
    });

    this.socket.on('allConnected', (data: any) => {
      this.message = data.message;
      this.isAllConnected = true;
      this.getQuestion();
      this.changeDetector.markForCheck();
    });

    this.socket.on('errorMessage', (data: any) => {
      this.message = data.message;
    });
  }

  createRoom() {
    this.socket.emit('createRoom');
  }

  joinRoom() {
    if (this.roomId.trim()) {
      this.socket.emit('joinRoom', { roomId: this.roomId });
      this.joined = true;
      this.message = `Csatlakozva a ${this.roomId} csoporthoz...`;
    }
  }

  sendAnswer(answer: number) {
    if (answer === 1) {
      this.clickedButton1 = true;
    } else if (answer === 2) {
      this.clickedButton2 = true;
    } else {
      this.clickedButton3 = true;
    }

    const body = {
      answer: answer
    };
    this.http.post('http://localhost:3000/api/answer', body).subscribe({
      next: (response) => this.displayAnswer(response, answer),
      error: (err) => console.error('Hiba történt:', err)
    });

    this.http.get('http://localhost:3000/api/wait').subscribe({
      next: res => console.log('Válasz:', res),
      error: err => console.error(err)
    });
   
  }
  displayAnswer(response: any, answer: number): void {
    this.solution = response;
    if (this.solution?.message === "A válasz helyes:") {
      switch (answer) {
        case 1: this.correctAnswer1 = true; break;
        case 2: this.correctAnswer2 = true; break;
        case 3: this.correctAnswer3 = true; break;
        default:
      }
      this.changeDetector.markForCheck();
    }
  }
}
