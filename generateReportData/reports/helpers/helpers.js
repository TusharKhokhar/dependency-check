const moment = require('moment')
const { zonedTimeToUtc } = require('date-fns-tz')

module.exports = {
    formatExecutiveData: (data, chartsData, filters, logo, dateString) => {
        return new Promise((resolve, reject) => {
            try {
                let data2 = data[0]
                let colorStatistics = [], duplexStats = [], jobStats = [], printersStats = [],
                    hourlyStats = [], dailyStats = [], orientationStats = [], stapleStats = [], paperSizeStats = []
                let colorCompositionTotal = 0, duplexComposition = 0, jobSubmissionComposition = 0, printers = 0, orientationComposition = 0, stapleComposition = 0, paperSizeComposition = 0;
                let timePeriod = moment(filters.dateTo).diff(filters.dateFrom, "days") === 0 ? 1 : moment(filters.dateTo).diff(filters.dateFrom, "days") + 1;

                /*
                            Used Map to find total count of values for all types of data
                                    */
                data2.colorComposition.forEach(count =>  colorCompositionTotal += count.page);
                data2.duplexComposition.forEach(count => duplexComposition += count.page);
                data2.jobSubmissionComposition.forEach(count => jobSubmissionComposition += count.page);
                data2.printers.forEach(count => printers += count.page);
                data2.orientationComposition.forEach(count => orientationComposition += count.page);
                data2.stapleComposition.forEach(count => stapleComposition += count.page);
                data2.paperSizeComposition.forEach(count => paperSizeComposition += count.page);
                /*
                Parameters required by Js report to render reports
                 */
                const stapleGroupData = data2.stapleComposition.reduce((acc, item) => {
                    const key = item._id.key;
                
                    if (key === null || key === "None") {
                        acc["Non Stapled"].page += item.page;
                    } else {
                        acc["Stapled"].page += item.page;
                    }
                    return acc;
                }, {
                    "Non Stapled": { "_id": { "key": "Non Stapled" }, "page": 0 },
                    "Stapled": { "_id": { "key": "Stapled" }, "page": 0 }
                });
                
                data2.stapleComposition = Object.values(stapleGroupData);
                data2.stapleComposition = data2.stapleComposition.filter((del) => {
                   if (filters.staple === true)
                     return del._id.key === "Stapled";
                   if (filters.staple === false)
                     return del._id.key === "Non Stapled";
                   return true;
                 });
                data2.colorComposition.forEach(del => {
                    colorStatistics.push({
                        "title": del._id.key,
                        "page": del.page,
                        "percent": colorCompositionTotal === 0 ? 0 : (((del.page) / colorCompositionTotal) * 100).toFixed(2)
                    })
                })
                data2.duplexComposition.forEach(del => {
                    duplexStats.push({
                        "title": del._id.key === true ? 'Duplex' : 'Simplex',
                        "page": del.page,
                        "percent": duplexComposition === 0 ? 0 : (((del.page) / duplexComposition) * 100).toFixed(2)
                    })
                })
                data2.jobSubmissionComposition.forEach(del => {
                    jobStats.push({
                        "title": del._id.key,
                        "page": del.page,
                        "percent": jobSubmissionComposition === 0 ? 0 : (((del.page) / jobSubmissionComposition) * 100).toFixed(2)
                    })
                })
                data2.printers.forEach(del => {
                    printersStats.push({
                        "title": del._id.key,
                        "page": del.page,
                        "percent": printers === 0 ? 0 : (((del.page) / printers) * 100).toFixed(2)
                    })
                })
                data2.orientationComposition.forEach(del => {
                    orientationStats.push({
                        "title": del._id.key,
                        "page": del.page,
                        "percent": orientationComposition === 0 ? 0 : (((del.page) / orientationComposition) * 100).toFixed(2)
                    })
                })
                data2.stapleComposition.forEach(del => {
                    stapleStats.push({
                        "title": del._id.key,
                        "page": del.page,
                        "percent": stapleComposition === 0 ? 0 : (((del.page) / stapleComposition) * 100).toFixed(2)
                    })
                })
                data2.paperSizeComposition.forEach(del => {
                    paperSizeStats.push({
                        "paperName": del._id.key,
                        "page": del.page,
                        "percent": paperSizeComposition === 0 ? 0 : (((del.page) / paperSizeComposition) * 100).toFixed(2)
                    })
                })
                chartsData[0].generalStatistics.forEach(del => {
                    dailyStats.push({
                        "label": del._id,
                        "data": del.count
                    })
                })
                chartsData[0].totalJobs.forEach(del => {
                    hourlyStats.push({
                        "label": del._id.hour,
                        "data": del.count
                    })
                })
                let dailyStatsTitle = dailyStats ? dailyStats.map(data => `${data.label}`) : []
                let dailyStatsData = dailyStats ? dailyStats.map(data => data.data) : []
                let hourlyStatsTitle = hourlyStats ? hourlyStats.map(data => `${data.label}:00`) : []
                let hourlyStatsData = hourlyStats ? hourlyStats.map(data => data.data) : []
                const totalJobs = data2.generalStatistics[0] && data2.generalStatistics[0].TotalJobs ? data2.generalStatistics[0].TotalJobs : 0
                const finalData = {
                    "logo": logo,
                    "date": dateString ,
                    "decimalSeparator": filters?.decimalSeparator || '.',
                    "decimal": filters?.decimalPlaces || 2,
                    currency: filters.currency ? filters.currency  : "$",
                    "general": {
                        "summaryDetails": [
                            {
                                "title": "Total Days",
                                "value": timePeriod
                            },
                            {
                                "title": "Total Pages",
                                "value": data2.generalStatistics[0] && data2.generalStatistics[0].TotalPages ? data2.generalStatistics[0].TotalPages : 0
                            },
                            {
                                "title": "Active Printers",
                                "value": data2.generalStatistics[0] && data2.generalStatistics[0].ActivePrinters ? data2.generalStatistics[0].ActivePrinters.length : 0
                            },
                            {
                                "title": "Total Jobs",
                                "value": totalJobs
                            }
                        ]
                    },
                    "colorComposition": {
                        "summaryDetails": colorStatistics
                    },
                    "duplexComposition": {
                        "summaryDetails": duplexStats
                    },
                    "jobSubmissionComposition": {
                        "summaryDetails": jobStats
                    },
                    "printers": {
                        "summaryDetails": printersStats
                    },
                    "orientationComposition": {
                        "summaryDetails": orientationStats
                    },
                    "stapleComposition": {
                        "summaryDetails": stapleStats
                    },
                    "paperSizeComposition": {
                        "summaryDetails": paperSizeStats
                    },
                    "daily": dailyStats,
                    "hourly": hourlyStats,
                    "chartDataDaily": {
                        title: dailyStatsTitle,
                        data: dailyStatsData
                    },
                    "chartDataHourly": {
                        title: hourlyStatsTitle,
                        data: hourlyStatsData
                    }
                }
                if (totalJobs === 0) {
                    resolve({finalData, dataAvailable: false})
                } else {
                    resolve({finalData, dataAvailable: true})
                }
            } catch (e) {
                console.log(e);
                reject(e)
            }

        })

    },

    formatPrinterUsage:  (data, filters, logo, dateString, customerIds, customerData) => {
        return new Promise((resolve, reject) => {
            let finalPrinterArray = []
            data.forEach(job => {
                let obj = {}
                obj.CustomerName = customerData[customerIds.indexOf(job._id.CustomerID.toString())].CustomerName
                obj.PrimaryColor = filters.primaryColor ? filters.primaryColor : '#0000FF'
                obj.PrinterData = []
                job.usages.forEach(del => {
                    del.Printer = del._id.Device
                    del.Jobs = del.Jobs.length
                    obj.PrinterData.push(del)
                })
                finalPrinterArray.push(obj)
            })
            let formattedData = {
                "logo": logo,
                "date": dateString,
                "decimalSeparator": filters?.decimalSeparator || '.',
                currency: filters.currency ? filters.currency  : "$",
                "decimal": filters?.decimalPlaces || 2,
                Customers: finalPrinterArray
            }
            resolve({formattedData, dataAvailable: finalPrinterArray?.length > 0})
        })
    },

    formTransactionReportsData:  (data, filters, logo, dateString, customerIds, customerData) => {
        return new Promise((resolve, reject) => {
            let transactionArray = []
            data.forEach(job => {
                let obj = {}
                obj = job
                obj.CustomerName = customerData[customerIds.indexOf(job._id.CustomerID.toString())].CustomerName
                transactionArray.push(obj)
            })
            let formattedData = {
                "logo": logo,
                "date": dateString,
                "decimalSeparator": filters?.decimalSeparator || '.',
                decimal: filters.decimalPlaces ? filters.decimalPlaces : 2,
                currency: filters.currency ? filters.currency  : "$",
                PrimaryColor: filters.primaryColor ? filters.primaryColor : '#0000FF',
                Transactions: transactionArray
            }
            if (transactionArray.length > 0) {
                resolve({formattedData, dataAvailable: true})
            } else {
                resolve({formattedData, dataAvailable: false})
            }
        })
    },

    formTransactionSummaryReportsData:  (data, filters, logo, dateString, customerIds, customerData) => {
        return new Promise((resolve, reject) => {
            let transactionArray = []
            data.forEach(job => {
                let obj = {}
                console.log(job);
                obj = job
                obj._id.CustomerName = customerData[customerIds.indexOf(job._id.CustomerID.toString())].CustomerName
                transactionArray.push(obj)
            })
            let formattedData = {
                "logo": logo,
                "date": dateString,
                decimal: filters.decimalPlaces ? filters.decimalPlaces : 2,
                "decimalSeparator": filters?.decimalSeparator || '.',
                currency: filters.currency ? filters.currency  : "$",
                PrimaryColor: filters.primaryColor ? filters.primaryColor : '#0000FF',
                Transactions: transactionArray
            }
            if (transactionArray.length > 0) {
                resolve({formattedData, dataAvailable: true})
            } else {
                resolve({formattedData, dataAvailable: false})
            }
        })
    },

    formAddValueSummary:  (data, filters, logo, dateString, customerIds, customerData) => {
        return new Promise((resolve, reject) => {
            let transactionArray = []
            data.forEach(job => {
                let obj = {}
                obj.CustomerName = customerData[customerIds.indexOf(job._id.toString())].CustomerName
                obj.users = job.users
                obj.Username = job.Username ? job.Username : ''
                obj.Amount = job.Amount ? job.Amount : 0
                transactionArray.push(obj)
            })
            let formattedData = {
                "logo": logo,
                "date": dateString,
                "decimalSeparator": filters?.decimalSeparator || '.',
                decimal: filters.decimalPlaces ? filters.decimalPlaces : 2,
                currency: filters.currency ? filters.currency  : "$",
                "PrimaryColor": filters.primaryColor ? filters.primaryColor : '#0000FF',
                Customers: transactionArray
            }
            if (transactionArray.length > 0) {
                resolve({formattedData, dataAvailable: true})
            } else {
                resolve({formattedData, dataAvailable: false})
            }
        })
    },
    
    parsePrimitive : (key) => {
        if (key === 'true') return true;
        if (key === 'false') return false;
        if (key === 'undefined' || key === undefined) return null;
        if (key === 'null' || key === null) return null;
        return key;
    },

    convertFilterTime: async (dateFrom, dateTo, timeZone) => {
        if (dateFrom && dateTo) {
          dateFrom = zonedTimeToUtc(dateFrom, timeZone)
          dateTo = zonedTimeToUtc(dateTo, timeZone)
          dateFrom = new Date(dateFrom)
          dateTo = new Date(dateTo)
          return { dateFrom, dateTo, timeZone }
        }
    },

    normalizeFilter: (filters) => {
        try {
            const normalizeValue = (value) => {
                const pattern = value.trim().replace(/\s+/g, "\\s*");
                return new RegExp(`^${pattern}$`, "i");
            };
            console.log('filters: ', filters);

            if (filters?.paymentType?.length > 0) {
                filters.paymentType = filters.paymentType.map(pt => normalizeValue(pt))
            }
            if (filters?.orientation?.length > 0) {
                filters.orientation = filters.orientation.map(ot => normalizeValue(ot))
            }
            if (filters?.transactionType?.length > 0) {
                filters.transactionType = filters.transactionType.map(transaction => normalizeValue(transaction))
            }
            if (filters?.colorType?.length > 0) {
                filters.colorType = filters.colorType.map(color => normalizeValue(color))
            }
            if (filters?.submissionType?.length > 0) {
                filters.submissionType = filters.submissionType.map(submission => normalizeValue(submission))
            }
            if (filters?.paperSize?.length > 0) {
                filters.paperSize = filters.paperSize.map(paper => normalizeValue(paper))
            }
            if (filters?.valueAddedMethod?.length > 0) {
                filters.valueAddedMethod = filters.valueAddedMethod.map(valueAdded => normalizeValue(valueAdded))
            }
            console.log('normalizedFilter filters: ', filters);
            return filters
            
        } catch (error) {
            console.log('Error normalizing filters:', error);
            return filters;
        }
    }
}
