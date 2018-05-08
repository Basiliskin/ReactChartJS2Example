import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import color from 'rcolor';
import {Bar,Pie} from 'react-chartjs-2';
//HorizontalBar,Doughnut,Radar,Polar 
//https://github.com/jerairrest/react-chartjs-2/blob/master/example/src/components/crazyLine.js

/*
bar(Quater):
	Y : price 	 ->datasets
		for item in category 
			
	X : Month[4] -> labels
	
//console.log(getQuaterData(),getYearData());

once chart load ,with required type - 
	if pie
		not needed labels are category
			- app will return totals.
		
	if bar
		quater 	= getQuaterData()
		year	= getYearData()
		 - app will returns  totals based on:
			date between firstDate and endDate

			
onMessage + postMessage
Redux
*/
function random(start,len)
{
	return Math.floor(Math.random() * len) + start;
}
function parseDate(str)
{
	return new Date(Date.parse(str));
}
const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
function* getDateLables(dt,n) {
	for(let i=0;i<n;i++)
	{
		yield  monthNames[dt.getMonth()];
		dt.setMonth(dt.getMonth()+1);		
	}
}
function createBarSet(label,data)
{
	const clr = color();
	const set = {
	  label: label,
	  backgroundColor: clr,
	  borderColor: clr,
	  borderWidth: 1,
	  hoverBackgroundColor: clr,
	  hoverBorderColor: clr,
	  data: data
	};
	
	return set;
}
function createRandomData()
{
	let arr = [];
	for(let i=1;i<13;i++)
	{
		const add = Math.random()*26>Math.random()*25;
		
		if(!add) continue;
		const n = i<10 ? `0${i}/01/2018` : `${i}/01/2018`;
		arr.push(
		{
			img		:'',
			date	:parseDate(n),
			total	:random(100,1000),
			tax		:random(5,30)
		});
	}
	//console.log('arr',arr.length);
	return arr;
}

let testData = {
	Label:[],
	bar:{
		'חשמל':createRandomData(),
		'גז':[],
		'מים':createRandomData(),
		'ארנונה':createRandomData()
	}
}

function getBarData(Bars,value,labelCount)
{
	let bars = [];
	let i=Bars.length-labelCount-1;
	if(i<0) i = 0;
	for(;i<Bars.length;i++)
	{
		const bar  = Bars[i];
		bars.push(!bar || !bar[value] ? 0 : bar[value]);
	}
	return bars;
}
function convertDataToChart(Data,labelCount,value)
{
	let {bar,Label} = Data;

	let chartData = {
		labels: Label.slice(-labelCount),
		datasets: []
	};
	for(let label in bar)
	{
		chartData.datasets.push(createBarSet(label,getBarData(bar[label],value,labelCount)));
	}
	return chartData;
}
function fillMissingData(Data)
{
	let len;
	let mapping = {};
	let timeValue = new Set();
	let {bar,Label} = Data;
	/* get Min / Max */
	for(let label in bar)
	{
		if(bar[label].length)
		{
			bar[label].sort(function(a,b){
				return (a.date - b.date);
			});
			const items = bar[label];
			
			if(!len || len<items.length) len = items.length;
			let Time = {};
			for(let i in items)
			{
				if(items[i])
				{
					const time = items[i].date.getTime();
					timeValue.add(time);
					Time[time] = parseInt(i,10)+1;
				}
			}
			mapping[label] = Time;
		}
	}
	let allTime = []
	for (let item of timeValue.values()) allTime.push(item);
	allTime.sort();
	for(let t of allTime)
		Label.push(monthNames[new Date(t).getMonth()]);
	/* fill missing */
	for(let label in bar)
	{
		if(len && !bar[label].length){
			bar[label] = new Array(len);
			bar[label].fill(undefined);
			mapping[label] = {};
		}
		
		let Time = mapping[label];
		let items = bar[label];
		let Items = [];
		for(let t of allTime)
		{
			if(Time[t])
			{
				Items.push({...items[Time[t]-1]});
			}
			else
			{
				Items.push(
				{
					img		:'',
					date	:new Date(t),
					total	:0,
					tax		:0
				});
			}
		}
		bar[label] = Items;		
	}
	
}


function convertDataToPieChart(Data,labelCount,value)
{
	let {bar,Label} = Data;

	let chartData = {
		labels: Label.slice(-labelCount),
		datasets: []
	};
	let clr = [];
	for(let lable in chartData.labels)
	{
		clr.push(color());
	}
	let dataset = {
		data:new Array(clr.length),
		backgroundColor:clr,
		hoverBackgroundColor:clr
	};
	dataset.data.fill(0);
	for(let d in bar)
	{
		const data = getBarData(bar[d],value,labelCount);
		for(let i in data)
		{
			dataset.data[i]+=data[i];
		}
	}
	chartData.datasets.push(dataset);
	return chartData;
}
function convertCategoryToPieChart(Data,labelCount,value)
{
	let {bar} = Data;

	let chartData = {
		labels: [],
		datasets: []
	};
	
	for(let label in bar)
	{
		chartData.labels.push(label);
	}
	let clr = [];
	for(let lable in chartData.labels)
	{
		clr.push(color());
	}
	let dataset = {
		data:[],
		backgroundColor:clr,
		hoverBackgroundColor:clr
	};
	for(let label of chartData.labels)
	{
		const data = getBarData(bar[label],value,labelCount);
		const sum = data.reduce((sum, x) => sum + x);
		dataset.data.push(sum);
	}
	
	chartData.datasets.push(dataset);
	return chartData;
}

const wrapHOC = (WrappedComponent) => {
  class Wrapper extends React.PureComponent {
    render() {
		const sharedProps = {
			width 	: Math.round(window.innerWidth*0.9),
			height 	: Math.round(window.innerHeight*0.9),
			options : Object.assign({
				maintainAspectRatio: false
			}, this.props.options),
			getElementsAtEvent : (evt)=>{
				console.log('getElementsAtEvent',evt);
			},
			getElementAtEvent : (evt)=>{
				console.log('getElementAtEvent',evt);
			}
		};
		return (
			<div>
				<WrappedComponent {...this.props} {...sharedProps}/>
			</div>
		);
    }  
  }
  return Wrapper;
}

const ChartSet = {
	bar:wrapHOC(Bar),
	pie:wrapHOC(Pie)
}
export class ChartView extends Component {
	
	render() {
		
		
		const randomChartType = ['year','quater','pyear','pquater','cyear','cquater'];
		const chartType = randomChartType[random(0,randomChartType.length)];
		
		const typeName = chartType=='year' || chartType=='quater' ? 'bar' : 'pie';
		var ChartType = ChartSet[typeName];
		let chartData;
		const now = new Date();
		
		fillMissingData(testData);
		
		const Animation =  {
			onComplete: function() {
				var chartInstance = this.chart;
				const height = chartInstance.height;
				var ctx = chartInstance.ctx;
				ctx.textAlign = "center";
				ctx.textBaseline = "bottom";
				ctx.fillStyle = 'black';
				ctx.font=window.innerWidth<700 ? "48px Arial" : "18px Arial";

				if(typeName!='bar')
				{
					this.data.datasets.forEach(function (dataset) {
						for (var i = 0; i < dataset.data.length; i++) {
							if(!dataset.data[i]) continue;
							var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model,
							  total = dataset._meta[Object.keys(dataset._meta)[0]].total,
							  mid_radius = model.innerRadius + (model.outerRadius - model.innerRadius)/2,
							  start_angle = model.startAngle,
							  end_angle = model.endAngle,
							  mid_angle = start_angle + (end_angle - start_angle)/2;
							  
							var percent = String(Math.round(dataset.data[i]/total*100)) + "%";

							var x = mid_radius * Math.cos(mid_angle);
							var y = mid_radius * Math.sin(mid_angle);
	
							ctx.fillStyle = '#444';
						  
							
							ctx.fillText(percent, model.x + x, model.y + y + 15);
						}
					});       
				}
				else
				{					
					this.data.datasets.forEach(function (dataset, i) {

						var meta = chartInstance.controller.getDatasetMeta(i);
						
						meta.data.forEach(function (bar, index) {
							var data = dataset.data[index]; 
							if(data)
							{
								ctx.fillText(data, bar._model.x, bar._model.y );
							}
						});
					})
				}
			}
		};
		const Title = {
				display: true,
				text: chartType.indexOf('year')>=0 ? 'Annual' : 'Monthly'
			}
		let options = chartType=='year' || chartType=='quater' ? {
			animation:Animation,
			title: Title
		} : {
			animation:Animation,
			title: Title,
			tooltips: {
				callbacks: {
				  label: function(tooltipItem, data) {
					var dataset = data.datasets[tooltipItem.datasetIndex];
					var meta = dataset._meta[Object.keys(dataset._meta)[0]];
					var total = meta.total;
					var currentValue = dataset.data[tooltipItem.index];
					var percentage = parseFloat((currentValue/total*100).toFixed(1));
					return currentValue + ' (' + percentage + '%)';
				  },
				  title: function(tooltipItem, data) {
					return data.labels[tooltipItem[0].index];
				  }
				}
			}
		};
		switch(chartType)
		{
			case 'year':
				chartData = convertDataToChart(testData,12,'total');
				break;
			case 'quater':
				chartData = convertDataToChart(testData,3,'total');
				break;
			case 'pyear':
				chartData = convertDataToPieChart(testData,12,'total');
				break;
			case 'pquater':
				chartData = convertDataToPieChart(testData,3,'total');
				break;
			case 'cyear':
				chartData = convertCategoryToPieChart(testData,12,'total');				
				break;
			case 'cquater':
				chartData = convertCategoryToPieChart(testData,3,'total');				
				break;
			default:
				chartData = convertDataToChart(testData,12,'total');
				break;
		}
		return <ChartType data={chartData} options={options}/>//dataPie || data
	}
}


ReactDOM.render(
  <div><ChartView/></div>,
  document.getElementById('app')
);

module.hot.accept();