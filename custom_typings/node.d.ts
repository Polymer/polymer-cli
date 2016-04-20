// copied from lib.es6.d.ts

declare var console: Console;

interface Console {
    assert(test?: boolean, message?: string, ...optionalParams: any[]): void;
    clear(): void;
    count(countTitle?: string): void;
    debug(message?: string, ...optionalParams: any[]): void;
    dir(value?: any, ...optionalParams: any[]): void;
    dirxml(value: any): void;
    error(message?: any, ...optionalParams: any[]): void;
    group(groupTitle?: string): void;
    groupCollapsed(groupTitle?: string): void;
    groupEnd(): void;
    info(message?: any, ...optionalParams: any[]): void;
    log(message?: any, ...optionalParams: any[]): void;
    // msIsIndependentlyComposed(element: Element): boolean;
    profile(reportName?: string): void;
    profileEnd(): void;
    // select(element: Element): void;
    time(timerName?: string): void;
    timeEnd(timerName?: string): void;
    trace(message?: any, ...optionalParams: any[]): void;
    warn(message?: any, ...optionalParams: any[]): void;
}

declare var Console: {
    prototype: Console;
    new(): Console;
}

declare module Intl {
    interface CollatorOptions {
        usage?: string;
        localeMatcher?: string;
        numeric?: boolean;
        caseFirst?: string;
        sensitivity?: string;
        ignorePunctuation?: boolean;
    }

    interface ResolvedCollatorOptions {
        locale: string;
        usage: string;
        sensitivity: string;
        ignorePunctuation: boolean;
        collation: string;
        caseFirst: string;
        numeric: boolean;
    }

    interface Collator {
        compare(x: string, y: string): number;
        resolvedOptions(): ResolvedCollatorOptions;
    }
    var Collator: {
        new (locales?: string[], options?: CollatorOptions): Collator;
        new (locale?: string, options?: CollatorOptions): Collator;
        (locales?: string[], options?: CollatorOptions): Collator;
        (locale?: string, options?: CollatorOptions): Collator;
        supportedLocalesOf(locales: string[], options?: CollatorOptions): string[];
        supportedLocalesOf(locale: string, options?: CollatorOptions): string[];
    }

    interface NumberFormatOptions {
        localeMatcher?: string;
        style?: string;
        currency?: string;
        currencyDisplay?: string;
        useGrouping?: boolean;
        minimumIntegerDigits?: number;
        minimumFractionDigits?: number;
        maximumFractionDigits?: number;
        minimumSignificantDigits?: number;
        maximumSignificantDigits?: number;
    }

    interface ResolvedNumberFormatOptions {
        locale: string;
        numberingSystem: string;
        style: string;
        currency?: string;
        currencyDisplay?: string;
        minimumIntegerDigits: number;
        minimumFractionDigits: number;
        maximumFractionDigits: number;
        minimumSignificantDigits?: number;
        maximumSignificantDigits?: number;
        useGrouping: boolean;
    }

    interface NumberFormat {
        format(value: number): string;
        resolvedOptions(): ResolvedNumberFormatOptions;
    }
    var NumberFormat: {
        new (locales?: string[], options?: NumberFormatOptions): NumberFormat;
        new (locale?: string, options?: NumberFormatOptions): NumberFormat;
        (locales?: string[], options?: NumberFormatOptions): NumberFormat;
        (locale?: string, options?: NumberFormatOptions): NumberFormat;
        supportedLocalesOf(locales: string[], options?: NumberFormatOptions): string[];
        supportedLocalesOf(locale: string, options?: NumberFormatOptions): string[];
    }

    interface DateTimeFormatOptions {
        localeMatcher?: string;
        weekday?: string;
        era?: string;
        year?: string;
        month?: string;
        day?: string;
        hour?: string;
        minute?: string;
        second?: string;
        timeZoneName?: string;
        formatMatcher?: string;
        hour12?: boolean;
        timeZone?: string;
    }

    interface ResolvedDateTimeFormatOptions {
        locale: string;
        calendar: string;
        numberingSystem: string;
        timeZone: string;
        hour12?: boolean;
        weekday?: string;
        era?: string;
        year?: string;
        month?: string;
        day?: string;
        hour?: string;
        minute?: string;
        second?: string;
        timeZoneName?: string;
    }

    interface DateTimeFormat {
        format(date?: Date | number): string;
        resolvedOptions(): ResolvedDateTimeFormatOptions;
    }
    var DateTimeFormat: {
        new (locales?: string[], options?: DateTimeFormatOptions): DateTimeFormat;
        new (locale?: string, options?: DateTimeFormatOptions): DateTimeFormat;
        (locales?: string[], options?: DateTimeFormatOptions): DateTimeFormat;
        (locale?: string, options?: DateTimeFormatOptions): DateTimeFormat;
        supportedLocalesOf(locales: string[], options?: DateTimeFormatOptions): string[];
        supportedLocalesOf(locale: string, options?: DateTimeFormatOptions): string[];
    }
}
