import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'time',
  standalone: true
})
export class TimePipe implements PipeTransform {
  transform(value: Date | string | number): string {
    const now = new Date();
    const inputDate = new Date(value);
    const differenceInSeconds = Math.floor(
      (now.getTime() - inputDate.getTime()) / 1000
    );

    if (differenceInSeconds < 60) {
      return `${differenceInSeconds} seconds ago`;
    }

    const differenceInMinutes = Math.floor(differenceInSeconds / 60);
    if (differenceInMinutes < 60) {
      return `${differenceInMinutes} minutes ago`;
    }

    const differenceInHours = Math.floor(differenceInMinutes / 60);
    if (differenceInHours < 24) {
      return `${differenceInHours} hours ago`;
    }

    const differenceInDays = Math.floor(differenceInHours / 24);
    if (differenceInDays < 30) {
      return `${differenceInDays} days ago`;
    }

    const differenceInMonths = Math.floor(differenceInDays / 30);
    if (differenceInMonths < 12) {
      return `${differenceInMonths} months ago`;
    }

    const differenceInYears = Math.floor(differenceInMonths / 12);
    return `${differenceInYears} years ago`;
  }
}
