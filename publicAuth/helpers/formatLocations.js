module.exports.formatLocations = (rows) => {
  return new Promise((resolve, reject) => {
    if (rows.length === 0) {
      resolve([])
    } else {
      // Filter enabled rows with non-empty Day values
      rows = rows.filter(row => row.Enable === true && row.Day && row.Day.trim() !== '')
      
      // Define day order to handle proper sequence detection
      const dayOrder = {
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6,
        'Sunday': 7
      }
      
      // Group by identical opening and closing times
      const groups = []
      rows.forEach((row, index) => {
        const day = row.Day
        const am = row.OpenTimes
        const pm = row.CloseTimes
        
        // Find existing group with same opening/closing times
        const group = groups.find(x => x.am === am && x.pm === pm)
        
        if (group) {
          group.days.push({ 
            name: day, 
            orderIndex: dayOrder[day] || 0 
          })
        } else {
          const group = {
            days: [{ 
              name: day, 
              orderIndex: dayOrder[day] || 0 
            }],
            am: am,
            pm: pm
          }
          groups.push(group)
        }
      })

      /**
       * Sort days by their natural order and identify consecutive day ranges
       * to create strings like "Mon - Fri" for consecutive days.
       */
      const finale = []

      groups.forEach(group => {
        // Sort days by their order index
        group.days.sort((a, b) => a.orderIndex - b.orderIndex)
        
        if (group.days.length > 1) {
          // Identify ranges of consecutive days
          const ranges = []
          let currentRange = [group.days[0]]
          
          for (let i = 1; i < group.days.length; i++) {
            const prevDay = group.days[i - 1]
            const currentDay = group.days[i]
            
            if (currentDay.orderIndex === prevDay.orderIndex + 1) {
              // Day is consecutive, add to current range
              currentRange.push(currentDay)
            } else {
              // Day is not consecutive, finish the current range and start a new one
              ranges.push([...currentRange])
              currentRange = [currentDay]
            }
          }
          
          // Add the last range
          ranges.push(currentRange)
          
          // Format the ranges into readable strings
          const formattedRanges = ranges.map(range => {
            if (range.length === 1) {
              return range[0].name
            } else {
              return `${range[0].name} - ${range[range.length - 1].name}`
            }
          })
          
          // Join the ranges with commas
          const days = formattedRanges.join(', ')
          finale.push(`${days} : ${group.am} - ${group.pm}`)
        } else {
          finale.push(`${group.days[0].name} : ${group.am} - ${group.pm}`)
        }
      })
      
      resolve(finale)
    }
  })
}
