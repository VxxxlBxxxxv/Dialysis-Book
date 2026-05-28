


export function getFormattedDate(date:Date)
{
    return date.toISOString().slice(0,10)
}

export function getDateMinusDays(date:Date,days:number){
    return new Date(date.getFullYear(),date.getMonth(),date.getDate()-days)
}

const WEEKDAYS_SHORT_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

// День недели (Пн/Вт/…) из строки даты YYYY-MM-DD. Пустая строка при невалидной дате.
export function getWeekdayShortRu(dateStr: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return "";
  const dt = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return WEEKDAYS_SHORT_RU[dt.getDay()];
}

export function getFormattedTime(time:string){

const date = new Date(time);
const hours = date.getHours().toString().padStart(2, '0');
const minutes = date.getMinutes().toString().padStart(2, '0');

return `${hours}:${minutes}`;

}


