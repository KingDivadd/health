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
