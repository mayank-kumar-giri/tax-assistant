import {
  isNil as _isNil,
} from 'ramda';

// Return a string having Indian Word Representation of a number
export const inWords = number => {
  const ones = ['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const tens = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];
  const units = ['shankh', 'padma', 'nil', 'kharab', 'arab', 'crore', 'lakh', 'thousand', 'hundred'];
  
  if ((number = number.toString()).length > 15) return 'Overflow';
  const numberSplit = ('0000000000000000000' + number).substr(-19).match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!numberSplit) return; 
  const lastIndex = numberSplit.length - 1;
  let text = '';

  numberSplit.forEach((element, index) => {
    if(index===0 || index===lastIndex || index===(lastIndex-1)) return;
    text += (element != 0) ? (ones[Number(element)] || tens[element[0]] + ' ' + ones[element[1]]) + ' ' + `${units[index - 1]} ` : '';
  });
  text += (numberSplit[lastIndex - 1] != 0) 
    ? (ones[Number(numberSplit[lastIndex - 1])] + ' ' + 'hundred ')
    : '';
  text += (numberSplit[lastIndex] != 0) 
    ? ((text != '') ? 'and ' : '') + (ones[Number(numberSplit[lastIndex])] || tens[numberSplit[lastIndex][0]] + ' ' + ones[numberSplit[lastIndex][1]]) + ' '
    : '';
  
  (text==='') && (text = 'zero ');
  text += 'only'
  return text.trim();
};

// Capitalize the given string
export const capitalize = (text, separator = ' ') => {
  if(_isNil(text)) return '';
  const textArray = text.split(separator);
  textArray.forEach((item, index) => {
    textArray[index] = item.charAt(0).toUpperCase() + item.slice(1);
  });
  return textArray.join(separator);
};

// Return a string having number with Indian style commas (localeString)
export const beautifyNumber = number => Number(number).toLocaleString('en-IN');

// Return the number corresponding to the given localeString
export const numerize = number => Number(number.replaceAll(',','').replaceAll(' ',''));

// Round upto n decimal places
export const round = (number, n=2) => (Math.round((number + Number.EPSILON) * (10 * n)) / (10 * n));
