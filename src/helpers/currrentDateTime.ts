import { NumberLiteralType } from "typescript";

function convertedDatetime(milliseconds?: number | string): number {
    let currentDateInMillis: number;
    
    if (milliseconds) {
        currentDateInMillis = typeof milliseconds === 'string' ? parseFloat(milliseconds) : milliseconds;
    } else {
        currentDateInMillis = new Date().getTime();
    }

    return currentDateInMillis;
}

export default convertedDatetime;


// export function readableDate(milliseconds:number) {
//     const date = new Date(milliseconds);
//     const month = date.toLocaleString("default", { month: "long" });
//     const day = date.getDate();
//     const year = date.getFullYear();
//     let hour = date.getHours();
//     const minute = date.getMinutes();
//     const second = date.getSeconds();
//     const ampm = hour >= 12 ? "PM" : "AM";
//     hour = hour % 12 || 12; // 12-hour clock
//     return `${month} ${day}, ${year} ${hour}:${minute}:${second} ${ampm}`;
//     }

export function readableDate(ms:number) {
    const date = new Date(ms);
    const options:any = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'Africa/Lagos', // or 'WAT'
    };
    return date.toLocaleDateString('en-US', options);
}