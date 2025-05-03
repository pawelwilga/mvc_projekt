exports.getHomeView = (req, res) => {
    const totalIncome = 13585.27;
    const totalPayments = 7591.87;
    const numberFormat = { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true };
    const profileCurrencyCode = "PLN";
  
    // Dane dla wykresu wydatków
    const expensesData = {
      labels: ['Jedzenie', 'Transport', 'Rozrywka', 'Rachunki', 'Inne'],
      datasets: [{
        label: 'Wydatki',
        data: [Math.floor(Math.random() * 500) + 1, Math.floor(Math.random() * 500) + 1, Math.floor(Math.random() * 500) + 1, Math.floor(Math.random() * 500) + 1, Math.floor(Math.random() * 500) + 1],
        backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'],
        hoverOffset: 4
      }]
    };
  
    const expensesConfig = {
      type: 'pie',
      data: expensesData,
    };
  
    // Dane dla wykresu przychodów
    const incomeData = {
      labels: ['Praca', 'Inwestycje', 'Inne'],
      datasets: [{
        label: 'Przychody',
        data: [Math.floor(Math.random() * 1000) + 1, Math.floor(Math.random() * 1000) + 1, Math.floor(Math.random() * 1000) + 1],
        backgroundColor: ['#28a745', '#007bff', '#6c757d'],
        hoverOffset: 4
      }]
    };
  
    const incomeConfig = {
      type: 'doughnut',
      data: incomeData,
    };
  
    // Dane dla wykresu podsumowania miesięcznego
    const monthlySummaryData = {
      labels: ['Bieżący miesiąc'],
      datasets: [
        { label: 'Oszczędności', data: [Math.floor(Math.random() * 300) + 1], backgroundColor: '#28a745' },
        { label: 'Inne wydatki', data: [Math.floor(Math.random() * 100) + 1], backgroundColor: '#9966ff' },
        { label: 'Rachunki', data: [Math.floor(Math.random() * 150) + 1], backgroundColor: '#4bc0c0' },
        { label: 'Rozrywka', data: [Math.floor(Math.random() * 200) + 1], backgroundColor: '#ffce56' },
        { label: 'Transport', data: [Math.floor(Math.random() * 250) + 1], backgroundColor: '#36a2eb' },
        { label: 'Jedzenie', data: [Math.floor(Math.random() * 350) + 1], backgroundColor: '#ff6384' },
        { label: 'Przychody', data: [Math.floor(Math.random() * 1500) + 1], backgroundColor: 'transparent', borderWidth: 2, borderColor: '#000000' }
      ]
    };
  
    const monthlySummaryConfig = {
      type: 'bar',
      data: monthlySummaryData,
      options: {
        indexAxis: 'y',
        scales: {
          x: { stacked: true, title: { display: true, text: 'Kwota (PLN)' } },
          y: { stacked: true, title: { display: true, text: 'Miesiąc' }, ticks: { beginAtZero: true } }
        },
        plugins: { legend: { reverse: true } }
      }
    };
  
    // Dane dla wykresu bilansu w czasie
    const balanceData = {
      labels: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'],
      datasets: [{
        label: 'Saldo',
        data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 20000) + 1),
        fill: false,
        borderColor: '#007bff',
        tension: 0.4
      }]
    };
  
    const balanceConfig = {
      type: 'line',
      data: balanceData,
      options: {
        responsive: true,
        scales: {
          x: { display: true, title: { display: true, text: 'Miesiąc' } },
          y: { display: true, title: { display: true, text: 'Kwota (PLN)' }, beginAtZero: true }
        },
        plugins: { legend: { display: false } }
      }
    };
  
    res.render("home", {
      totalIncome: totalIncome,
      totalPayments: totalPayments,
      totalBalance: (totalIncome - totalPayments),
      profileCurrencyCode: profileCurrencyCode,
      numberFormat: numberFormat,
      expensesConfig: JSON.stringify(expensesConfig), // Przekazujemy konfiguracje jako JSON
      incomeConfig: JSON.stringify(incomeConfig),
      monthlySummaryConfig: JSON.stringify(monthlySummaryConfig),
      balanceConfig: JSON.stringify(balanceConfig),
    });
  };