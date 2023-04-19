import { Component, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  public chart: any;
  constructor() {}

  ngOnInit() {
    this.lineChart();
    this.doughnutChart();
  }
  lineChart() {
    this.chart = new Chart('MyChart', {
      type: 'line', //this denotes tha type of chart

      data: {
        // values on X-Axis
        labels: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ],
        datasets: [
          {
            label: 'Sales',
            data: ['467', '576', '572', '79', '92', '574', '573', '576'],
            backgroundColor: 'blue',
          },
          // {
          //   label: 'Profit',
          //   data: ['542', '542', '536', '327', '17', '0.00', '538', '541'],
          //   backgroundColor: 'limegreen',
          // },
        ],
      },
      options: {
        aspectRatio: 1.5,
      },
    });
  }
  doughnutChart() {
    this.chart = new Chart('doughnut-chart', {
      type: 'doughnut',
      data: {
        labels: ['Africa', 'Asia', 'Europe', 'Latin America', 'North America'],
        datasets: [
          {
            label: 'Population (millions)',
            backgroundColor: [
              '#3e95cd',
              '#8e5ea2',
              '#3cba9f',
              '#e8c3b9',
              '#c45850',
            ],
            data: [2478, 5267, 734, 784, 433],
          },
        ],
      },
      // options: {
      //   title: {
      //     display: true,
      //     text: 'Category of Asset Statistics',
      //   },
      // },
    });
  }
}
