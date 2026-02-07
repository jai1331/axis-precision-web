import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import moment from 'moment';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Web-oriented utils that replicate React Native util.js functionality

// Remove serverURL and baseURL logic
// All API calls should use relative URLs

// Authentication functions
export const doLogin = async (username: string, password: string) => {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    username,
    password
  });

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow' as RequestRedirect
  };

  try {
    const response = await fetch(`/api/login`, requestOptions);
    const result = await response.json();
    
    if (result.status === 'ok') {
      return { 
        status: true, 
        data: { 
          'token': result.data, 
          'user': result.user 
        } 
      };
    } else {
      return { status: false, data: "Invalid username or password." };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { status: false, data: "Invalid username or password." };
  }
};

// Save admin entry form
export const saveAdminEntryForm = async (values: any, FETCH_TYPE: string = 'saveAdminForm') => {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({ ...values });

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow' as RequestRedirect
  };

  try {
    const response = await fetch(`/api/${FETCH_TYPE}`, requestOptions);
    const result = await response.json();
    
    if (result.status === 'ok') {
      console.log('Got res saved', result);
      return ({ status: result.status, response: result.response });
    }
  } catch (error) {
    console.error('Save error:', error);
    return ({ status: false, data: "Invalid request" });
  }
};

// Get employee data
export const getEmployeeData = async (startDate: string, endDate: string) => {
  try {
    const response = await fetch(`/api/getEmployeeData?startDate=${startDate}&endDate=${endDate}`);
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    return body;
  } catch (error) {
    console.error('Get employee data error:', error);
    throw error;
  }
};

// Get customer list
export const getCustomerList = async () => {
  try {
    const response = await fetch(`/api/getCustomerList`);
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    return body;
  } catch (error) {
    console.error('Get customer list error:', error);
    throw error;
  }
};

// Update admin entry form
export const updateAdmitEntryForm = async (values: any, _id: string, type: string = "admin") => {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  
  const raw = JSON.stringify({ ...values, 'id': _id });

  const requestOptions: RequestInit = {
    method: 'PUT',
    headers: myHeaders,
    body: raw,
    redirect: 'follow' as RequestRedirect
  };

  let urlType = "updateAdmitEntryForm";
  if (type === "employee") urlType = 'updateEmployeeForm';
  
  try {
    const response = await fetch(`/api/${urlType}`, requestOptions);
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    return body;
  } catch (error) {
    console.error('Update error:', error);
    throw error;
  }
};


export function addTimes(startTime: string, endTime: string, settingTime: string = '00:00:00'): string {
  const max = 3;
  const a: number[] = (startTime || '').split(':').map(x => parseInt(x) || 0);
  const b: number[] = (endTime || '').split(':').map(x => parseInt(x) || 0);
  const c: number[] = (settingTime || '').split(':').map(x => parseInt(x) || 0);
  const times: number[] = [0, 0, 0];
  

  for (let i = 0; i < max; i++) {
    times[i] = a[i] + b[i] + c[i];
  }

  let hours = times[0];
  let minutes = times[1];
  let seconds = times[2];

  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    minutes += m;
    seconds -= 60 * m;
  }

  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    hours += h;
    minutes -= 60 * h;
  }

  return ('0' + hours) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2);
}

export function getWorkingHrDiff(date: string, startTime: string, endTime: string): string | undefined {
  if (startTime && endTime && (startTime.includes('am') || endTime.includes('pm') || startTime.includes('pm') || endTime.includes('am'))) {
    let startDate = '01/01/2022';
    let endDate = '01/01/2022';
    if (startTime.includes('pm') && endTime.includes('am')) {
      let nextDay = parseInt(startDate.split('/')[1]);
      endDate = `${startDate.split('/')[0]}/${nextDay + parseInt('01')}/${startDate.split('/')[2]}`;
    }
    let timeStart = new Date(`${startDate} ${`${startTime.split(':')[0]}:${startTime.split(':')[1]} ${startTime.split(':')[2]}`}`);
    let timeEnd = new Date(`${endDate} ${`${endTime.split(':')[0]}:${endTime.split(':')[1]} ${endTime.split(':')[2]}`}`);
    if (date === 'total') {
      timeStart = new Date(`${startDate} ${startTime}`);
      timeEnd = new Date(`${endDate} ${endTime}`);
    }
    let diff = (timeEnd.getTime() - timeStart.getTime()) / 60000;
    let minutes = diff % 60;
    let hours = (diff - minutes) / 60;
    return `${('0' + hours).slice(-2)}:${('0' + minutes).slice(-2)}`;
  }
}

export const getTotalIdleTime = (data: any[]): { idleTime: string } => {
  return data.reduce<{ idleTime: string }>((acc, obj) => {
    let addTime = addTimes(acc.idleTime, obj.idleTime, '00:00:00');
    return { idleTime: addTime };
  }, { idleTime: '00:00:00' });
};

export const getTotalMachineHrs = (machineData: any[], workMode: boolean = false): any => {
  const timeCollectionArr = Object.assign(machineData.map((cur) => ({ [cur._id]: (addTimes(cur.cycleTime, cur.handlingTime, '00:00:00')) })), {});
  const timeCollectionObj = Object.assign({}, ...timeCollectionArr);
  const timeCollectionWithQtyCount = machineData.map(o => ({ [o._id]: Array((o.additionalQty ? o.qty + o.additionalQty : o.qty)).fill(timeCollectionObj[o._id]) }));
  const timeCollectionWithQtyCountObj = Object.assign({}, ...timeCollectionWithQtyCount);
  const timeCollectionQtyMultiplied = machineData.map(o => ({ [o._id]: timeCollectionWithQtyCountObj[o._id].reduce(function (acc: string, obj: string) {
    let addTime = addTimes(acc, obj, '00:00:00');
      return addTime;
  }, '00:00:00') }));
  const timeCollectionQtyaMultipliedObj = Object.assign({}, ...timeCollectionQtyMultiplied);
  const timeCollectionQtyWithSettingTimeKey = machineData.map(o => {
    // Prefer existing totalWorkingHrs from API (e.g. from employee form) so it's not overwritten with 0
    const existingWorking = (o.totalWorkingHrs || o.totalWorkingHr || '').toString().trim();
    let totalWrkHr = existingWorking;
    if (!totalWrkHr || totalWrkHr === '0' || totalWrkHr === '0:00' || totalWrkHr === '00:00:00') {
      const startEndTimeDiff = getWorkingHrDiff(o.date, o.startTime?.toLowerCase?.() || '', o.endTime?.toLowerCase?.() || '');
      if (startEndTimeDiff) {
        const idleParts = (o.idleTime || '00:00:00').split(':');
        const duration = moment.duration({ hours: parseInt(idleParts[0], 10) || 0, minutes: parseInt(idleParts[1], 10) || 0 });
        totalWrkHr = moment(startEndTimeDiff, 'HH:mm').subtract(duration).format('HH:mm');
      }
    }
    return {
      ...o,
      'totalProductionHr': addTimes(timeCollectionQtyaMultipliedObj[o._id], o.settingTime, '00:00:00'),
      ...(totalWrkHr && { 'totalWorkingHrs': totalWrkHr })
    };
  });
  const timeCollectionQtyWithSettingTime = machineData.map(o => addTimes(timeCollectionQtyaMultipliedObj[o._id], o.settingTime, '00:00:00'));
  const machineTotalTime = timeCollectionQtyWithSettingTime.reduce((acc: string, obj: string) => {
    let addTime = addTimes(acc, obj, '00:00:00');
    return addTime;
  }, '00:00:00');
  const componentWiseData = machineData.map(o => ({ 'time': addTimes(timeCollectionQtyaMultipliedObj[o._id], o.settingTime, '00:00:00'), 'component': o.componentName }));
  const componentWiseDataGroupedBy = componentWiseData.reduce((acc: any, obj: any) => {
    if (!acc[obj.component]) acc[obj.component] = [];
    acc[obj.component].push(obj.time);
    return acc;
  }, {});
  const componentWiseMachiHr = Object.keys(componentWiseDataGroupedBy).map(o => ({ [o]: componentWiseDataGroupedBy[o].reduce((acc: string, obj: string) => {
    let addTime = addTimes(acc, obj, '00:00:00');
      return addTime;
  }, '00:00:00') }));
  const componentWiseMachiHrObj = Object.assign({}, ...componentWiseMachiHr);
  if (workMode) {
    return timeCollectionQtyWithSettingTimeKey;
  }
  return { machineTotalTime, componentWiseMachiHrObj };
};

export const getTotalWorkingHrs = (data: any[]): { totalWorkingHrs: string } => {
  return data.reduce<{ totalWorkingHrs: string }>((acc, obj) => {
    const working = obj.totalWorkingHrs || obj.totalWorkingHr || '00:00:00';
    const addTime = addTimes(acc.totalWorkingHrs, working, '00:00:00');
    return { totalWorkingHrs: addTime };
  }, { totalWorkingHrs: '00:00:00' });
};

// // Time utility functions - matches React Native exactly
// export const addTimes = (startTime: string, endTime: string) => {
//   var max = 3;
//   var a = (startTime || '').split(':').map(x => parseInt(x) || 0);
//   var b = (endTime || '').split(':').map(x => parseInt(x) || 0);
//   var times = [0, 0, 0];

//   for (var i = 0; i < max; i++) {
//     times[i] = a[i] + b[i];
//   }

//   var hours = times[0];
//   var minutes = times[1];
//   var seconds = times[2];

//   if (seconds >= 60) {
//     var m = Math.floor(seconds / 60);
//     minutes += m;
//     seconds -= 60 * m;
//   }

//   if (minutes >= 60) {
//     var h = Math.floor(minutes / 60);
//     hours += h;
//     minutes -= 60 * h;
//   }

//   return ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2);
// };

// export const subtractTimes = (startTime: string, endTime: string) => {
//   var max = 3;
//   var a = (startTime || '').split(':').map(x => parseInt(x) || 0);
//   var b = (endTime || '').split(':').map(x => parseInt(x) || 0);
//   var times = [0, 0, 0];

//   for (var i = 0; i < max; i++) {
//     times[i] = a[i] - b[i];
//   }

//   var hours = times[0];
//   var minutes = times[1];
//   var seconds = times[2];

//   if (seconds < 0) {
//     var m = Math.ceil(Math.abs(seconds) / 60);
//     minutes -= m;
//     seconds += 60 * m;
//   }

//   if (minutes < 0) {
//     var h = Math.ceil(Math.abs(minutes) / 60);
//     hours -= h;
//     minutes += 60 * h;
//   }

//   return ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2);
// };

// export const getWorkingHrDiff = (date: string, startTime: string, endTime: string) => {
//   if(startTime && endTime && (startTime.includes('am') || endTime.includes('pm') || startTime.includes('pm') || endTime.includes('am'))) {
//     // let startDate = `${date.split('-')[1]}-${date.split('-')[0]}-${date.split('-')[2]}`;
//     // let endDate = `${date.split('-')[1]}-${date.split('-')[0]}-${date.split('-')[2]}`;
//     let startDate = '01/01/2022';
//     let endDate= '01/01/2022';
//     if(startTime.includes('pm') && endTime.includes('am')) {
//         let nextDay = parseInt(startDate.split('/')[1]);
//         endDate = `${startDate.split('/')[0]}/${nextDay+parseInt('01')}/${startDate.split('/')[2]}`;
//         //console.log('endDatem', endDate) 
//     }
    
//     // Fix time format - handle cases like "01:00:AM" or "01:00:PM"
//     let formattedStartTime = startTime;
//     let formattedEndTime = endTime;
    
//     // If time format is like "01:00:AM", convert to "01:00 AM"
//     if (startTime.includes(':AM') || startTime.includes(':PM')) {
//       formattedStartTime = startTime.replace(':AM', ' AM').replace(':PM', ' PM');
//     }
//     if (endTime.includes(':AM') || endTime.includes(':PM')) {
//       formattedEndTime = endTime.replace(':AM', ' AM').replace(':PM', ' PM');
//     }
    
//     let timeStart = new Date(`${startDate} ${formattedStartTime}`);
//     let timeEnd = new Date(`${endDate} ${formattedEndTime}`);
//     if(date === 'total') {
//       timeStart = new Date(`${startDate} ${formattedStartTime}`);
//       timeEnd = new Date(`${endDate} ${formattedEndTime}`);
//     }
//     //console.log(startTime, 'date', moment('01/01/2022'+ startTime, "DD/MM/YYYY HH:mm:ss").format(`DD/MM/YYYY HH:mm ${startTime.includes('am') ? 'A': 'P'}`), 'jend', endTime, moment(`${incrDay ? '02': '01'}/01/2022 ${endTime}`,"DD/MM/YYYY HH:mm:ss").format(`DD/MM/YYYY HH:mm ${endTime.includes('am') ? 'A': 'P'}`))
//     //console.log(timeStart,'timeStart', new Date("01/01/2007 " + "05:00 AM"), 'a', timeEnd)
//     let diff = (timeEnd.getTime() - timeStart.getTime()) / 60000; //dividing by seconds and milliseconds

//     let minutes = diff % 60;
//     let hours = (diff - minutes) / 60;
//     //console.log('opt', hours, minutes, timeStart, timeEnd)
//     const result = `${('0' + hours).slice(-2)}:${('0' + minutes).slice(-2)}`;
    
//     // Debug: Log some calculations
//     if (hours > 10) {
//       console.log('getWorkingHrDiff:', startTime, 'to', endTime, '=', result, 'hours:', hours, 'minutes:', minutes);
//     }
    
//     return result;
//   }
//   return null;
// };

// // Data aggregation functions - matches React Native exactly
// export const getTotalIdleTime = (data: any[]) => {
//   return data.reduce(function (acc: any, obj: any) { 
//     //console.log('acc', acc, 'obj', obj.idleTime)
//     let addTime = addTimes(acc.idleTime, obj.idleTime);
//     //console.log('addTimes', addTime)
//     return acc = ({ 'idleTime': addTime });
//   }, { idleTime: '00:00:00' });
// };

// export const getTotalMachineHrs = (machineData: any[], workMode: boolean = false) => {
//   console.log('getTotalMachineHrs called with:', machineData.length, 'records, workMode:', workMode);
  
//   const timeCollectionArr = Object.assign(machineData.map((cur: any) => ({[cur._id]: (addTimes(cur.cycleTime, cur.handlingTime))}) ), {});
//   const timeCollectionObj = Object.assign({}, ...timeCollectionArr );
//   //handleingtime+cycletime*qty then add it with setting time
//   // if additional qty is available add that to original qty 
//   const timeCollectionWithQtyCount = machineData.map((o: any) => ({ [o._id] : Array((o.additionalQty ? o.qty + o.additionalQty : o.qty)).fill(timeCollectionObj[o._id]) }) )
//   const timeCollectionWithQtyCountObj = Object.assign({}, ...timeCollectionWithQtyCount)
//   const timeCollectionQtyMultiplied = machineData.map((o: any) => ({ [o._id]: timeCollectionWithQtyCountObj[o._id].reduce(function (acc: string, obj: string) {
//     let addTime = addTimes(acc, obj);
//     return acc = addTime;
//   }, '00:00:00') })) 
//   const timeCollectionQtyaMultipliedObj = Object.assign({}, ...timeCollectionQtyMultiplied);
//   const timeCollectionQtyWithSettingTimeKey = machineData.map((o: any) => {
//     let startEndTimeDiff = getWorkingHrDiff(o.date, o.startTime.toLowerCase(), o.endTime.toLowerCase());
//     let totalWrkHr = "";
//     //console.log('sub before', startEndTimeDiff, 'o._componentName', o.componentName, 'time', o.startTime, o.endTime);
//     if(startEndTimeDiff) { 
//       //totalWrkHr = getWorkingHrDiff('total', `${o.idleTime.split(':')[0]}:${o.idleTime.split(':')[1]} am`, `${startEndTimeDiff} am`)
//       let duration = moment.duration({hours: o.idleTime.split(':')[0], minutes: o.idleTime.split(':')[1]});
//       totalWrkHr = moment(startEndTimeDiff, 'HH:mm').subtract(duration).format('HH:mm');
//       //console.log('sub', totalWrkHr, 'o._componentName', o.componentName, `${startEndTimeDiff}`,`${o.idleTime.split(':')[0]}:${o.idleTime.split(':')[1]}`, o.idleTime);
//     }
//     return ({ 
//       ...o,
//       'totalProductionHr': addTimes(timeCollectionQtyaMultipliedObj[o._id], o.settingTime), 
//       ...totalWrkHr && ({ 
//         'totalWorkingHrs': (totalWrkHr)
//       })
//     });
//   });
  
//   // Debug: Check a few processed records
//   if (workMode && timeCollectionQtyWithSettingTimeKey.length > 0) {
//     console.log('Sample processed record:', timeCollectionQtyWithSettingTimeKey[0]);
//     console.log('TC-1 records count:', timeCollectionQtyWithSettingTimeKey.filter((item: any) => item.machine === 'TC-1').length);
//   }
  
//   //console.log('timeCollectionQtyWithSettingTimeKey', JSON.stringify(timeCollectionQtyWithSettingTimeKey));
//   const timeCollectionQtyWithSettingTime = machineData.map((o: any) => addTimes(timeCollectionQtyaMultipliedObj[o._id], o.settingTime) )
//   const machineTotalTime = timeCollectionQtyWithSettingTime.reduce((acc: string, obj: string) =>  {
//     let addTime = addTimes(acc, obj);
//     return acc = addTime;
//   }, '00:00:00');
//   const componentWiseData = machineData.map((o: any) => ({ 'time':  addTimes(timeCollectionQtyaMultipliedObj[o._id], o.settingTime), 'component': o.componentName }) )
//   const componentWiseDataGroupedBy = componentWiseData.reduce((acc: any, obj: any) => {
//     if(!acc[obj.component]) acc[obj.component] = [];
//     acc[obj.component].push(obj.time);
//     return acc;
//   }, {});
//   const componentWiseMachiHr = Object.keys(componentWiseDataGroupedBy).map((o: string) => ({[o] : componentWiseDataGroupedBy[o].reduce((acc: string, obj: string) =>  {
//     let addTime = addTimes(acc, obj);
//     return acc = addTime;
//   }, '00:00:00') }));
//   const componentWiseMachiHrObj = Object.assign({}, ...componentWiseMachiHr);
//   if(workMode) {
//     return timeCollectionQtyWithSettingTimeKey;
//   }
//   return {machineTotalTime, "componentWiseMachiHrObj": componentWiseMachiHrObj};
// };

// export const getTotalWorkingHrs = (data: any[]) => {
//   return data.reduce(function (acc: any, obj: any) { 
//     //console.log('acc', acc, 'obj', obj.totalWorkingHrs)
//     let addTime = addTimes(acc.totalWorkingHrs, obj.totalWorkingHrs);
//     //console.log('addTimes', addTime);
//     return acc = ({ 'totalWorkingHrs': addTime });
//   }, { totalWorkingHrs: '00:00:00' });
// };

// Date formatting utility - matches React Native exactly (DD-MM-YYYY format)
export const formatDate = (date: Date) => {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [day, month, year].join('-');
};

// Download summary in Excel - matches React Native
export const downloadSummaryInExcel = async (startDate: string, endDate: string) => {
  try {
    const response = await fetch(`/api/downloadExcel?startDate=${startDate}&endDate=${endDate}`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'production_summary.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  } catch (error) {
    console.error('Download error:', error);
  }
};

// Export all functions
export {
  // serverURL,
  // baseURL
};

// Component and customer data from legacy code
export const componentsList = [
  { id: 1, color: "#FF4500", customerName: "ARROW TECH ENGG", tc: ['TC-1', 'TC-2'], componentName: ['OD-55 LN 34'], date: '20/12/2021' },
  { id: 2, color: "#87CEEB", customerName: "OM SAKTHI", tc: ['TC-1'], componentName: ['DIA 107 LN 20 ID-66'], date: '20/12/2021' },
  { id: 3, color: "#4682B4", customerName: "SARVAM ENGG", tc: ['TC-1', 'TC-2'], componentName: ['PILOT VALVE BODY'], date: '20/12/2021' },
  { id: 4, color: "#6A5ACD", customerName: "NP ENGINEERING", tc: ['TC-1', 'TC-2'], componentName: ['BEARING HOUSING'], date: '21/12/2021' },
  { id: 5, color: "#FF69B4", customerName: "INTECH ENGG", tc: ['TC-1', 'TC-2'], componentName: ['OD-55 LN 34'], date: '20/12/2021' },
  { id: 6, color: "#00BFFF", customerName: "SIRIUS", tc: ['TC-1', 'TC-2'], componentName: ['BEARING HOUSING'], date: '23/12/2021' },
  { id: 7, color: "#00FFFF", customerName: "SUCCESS", tc: ['TC-1'], componentName: ['CASTING OD 140 LN 68 BORE 80'], date: '22/12/2021' },
  { id: 8, color: "#20B2AA", customerName: "SHAKTHI TECH", tc: ['TC-1'], componentName: ['SIDE PLATE'], date: '22/12/2021' },
  { id: 9, color: "#191970", customerName: "SRI ENGG", tc: ['TC-1'], componentName: ['OD-55 LN 34'], date: '20/12/2021' }
];

export const operatorList = Array.from({ length: 50 }, (_, i) => i + 1);

export const summaryData = {
  'Component production Hr': {
    'tc1': {},
    'tc2': {},
    'VMC': {},
    'tc3': {}
  },
  'Total production Hr': '',
  'Total idle Hr': '',
  'Total working Hr': ''
};