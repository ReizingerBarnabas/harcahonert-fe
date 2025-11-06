import { ChangeDetectorRef, Component, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  public question: any;
  public questionId: number = 0;
  public isStarted: boolean = false;
  public solution: Object = {};
  public counter: number = 0;
  public clickedButton1: boolean = false;
  public clickedButton2: boolean = false;
  public clickedButton3: boolean = false;
  constructor(private http: HttpClient, private changeDetector: ChangeDetectorRef) { }
  ngOnInit() {
    setTimeout(() => {
      this.changeDetector.markForCheck();
  }, 1000);
  }

  getQuestion() {
    this.isStarted = true;
    this.changeDetector.markForCheck();
    this.questionId++;
    this.http.get(`http://localhost:3000/api/question/${this.questionId}`).subscribe({
      next: (res) => this.question = res,
      error: (err) => {
        console.error('Hiba történt:', err);
        this.question = null;
      }
    });
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
      next: (response) => this.solution = response,
      error: (err) => console.error('Hiba történt:', err)
    });
  }
}
