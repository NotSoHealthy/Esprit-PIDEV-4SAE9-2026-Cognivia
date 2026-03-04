import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'highlightSearch',
    standalone: true
})
export class HighlightSearchPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(value: string | undefined, searchTerm: string | undefined): SafeHtml {
        if (!value) return '';
        if (!searchTerm || !searchTerm.trim()) {
            return this.sanitizer.bypassSecurityTrustHtml(this.escapeHtml(value));
        }

        const escapedValue = this.escapeHtml(value);
        const escapedSearchTerm = this.escapeRegExp(searchTerm.trim());

        const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
        let highlighted = escapedValue.replace(regex, '<span class="search-highlight">$1</span>');

        // Re-apply mention and hashtag highlighting as they were replaced in the template
        const hashtagRegex = /(#[a-zA-Z0-9_]+)/g;
        const mentionRegex = /(@[a-zA-Z0-9_]+)/g;

        highlighted = highlighted
            .replace(hashtagRegex, '<span class="hashtag">$1</span>')
            .replace(mentionRegex, '<span class="mention">$1</span>');

        return this.sanitizer.bypassSecurityTrustHtml(highlighted);
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    private escapeRegExp(text: string): string {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }
}
