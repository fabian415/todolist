import React, { useRef, useCallback } from 'react';
import * as d3 from 'd3';
import useResizeObserver from '../hooks/useResizeObserver';

function OverviewDashboard({ overviewData, onOpenProjectModal, onSelectProject }) {
  const { projectStatusSummary, completionTrend } = overviewData;
  const hasProjects = projectStatusSummary.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6">專案績效總覽</h2>
      
      {!hasProjects ? (
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg bg-white">
          <div className="text-center text-gray-500 p-4">
            <p className="text-lg md:text-xl">目前沒有活躍的任務和專案。</p>
            <button
              onClick={onOpenProjectModal}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
            >
              🚀 建立第一個專案
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 專案進度條狀圖 */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
              各專案任務狀態分佈
            </h3>
            <ProjectProgressBarChart 
              data={projectStatusSummary} 
              onSelectProject={onSelectProject} 
            />
            <p className="mt-4 text-sm text-gray-500">
              點擊 Y 軸的專案名稱可快速切換到該看板。
            </p>
          </div>

          {/* 任務完成趨勢線圖 */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
              近期任務完成趨勢 (每日)
            </h3>
            <CompletionTrendLineChart data={completionTrend} />
            <p className="mt-4 text-sm text-gray-500">
              顯示過去完成的任務數量，反映團隊的工作效率。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// D3 專案進度條狀圖元件
function ProjectProgressBarChart({ data, onSelectProject }) {
  const chartContainerRef = useRef(null);
  const svgRef = useRef(null);

  const drawChart = useCallback((width) => {
    if (!data.length) return;

    const margin = { top: 10, right: 30, bottom: 40, left: 120 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = data.length * 60;
    const svgHeight = chartHeight + margin.top + margin.bottom;

    const svgRoot = d3.select(svgRef.current);
    svgRoot.selectAll('*').remove();
    
    svgRoot
      .attr("width", width)
      .attr("height", svgHeight);

    const svg = svgRoot
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const keys = ['todo', 'doing', 'done'];
    const stack = d3.stack().keys(keys);
    const stackedData = stack(data);

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) || 1])
      .range([0, chartWidth]);

    const y = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([0, chartHeight])
      .padding(0.3);
      
    const color = d3.scaleOrdinal()
      .domain(keys)
      .range(['#ef4444', '#f59e0b', '#10b981']);

    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).tickSize(0).tickPadding(10))
      .selectAll('text')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        const project = data.find(p => p.name === d);
        if (project) {
          onSelectProject(project.id);
        }
      })
      .attr("fill", "#1d4ed8")
      .attr("font-weight", "600");

    svg.append("g")
      .selectAll("g")
      .data(stackedData)
      .join("g")
        .attr("fill", d => color(d.key))
      .selectAll("rect")
      .data(d => d)
      .join("rect")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d.data.name))
        .attr("height", y.bandwidth())
        .attr("width", d => x(d[1]) - x(d[0]))
        .attr("rx", 4)
        .attr("ry", 4)
      .append("title")
        .text(d => {
          const keyMap = { todo: '待辦', doing: '進行中', done: '已完成' };
          return `${d.data.name} - ${keyMap[d.key]}: ${d.data[d.key]}`;
        });

    const legend = svg.append("g")
      .attr("text-anchor", "start")
      .attr("transform", `translate(0, ${chartHeight + 20})`)
      .style("font-size", "12px");

    keys.forEach((key, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(${i * 70}, 0)`);
      
      legendItem.append("rect")
        .attr("x", 0)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", color(key))
        .attr("rx", 2);
      
      legendItem.append("text")
        .attr("x", 12)
        .attr("y", 9)
        .text(key === 'todo' ? '待辦' : key === 'doing' ? '進行中' : '已完成')
        .attr("fill", "#4b5563");
    });
  }, [data, onSelectProject]);

  // 使用優化的 ResizeObserver
  useResizeObserver(
    chartContainerRef,
    useCallback(({ width }) => {
      if (width > 0) {
        drawChart(width);
      }
    }, [drawChart])
  );

  return (
    <div ref={chartContainerRef} className="w-full h-auto min-h-[150px]">
      <svg ref={svgRef}></svg>
    </div>
  );
}

// D3 任務完成趨勢線圖元件
function CompletionTrendLineChart({ data }) {
  const chartContainerRef = useRef(null);
  const svgRef = useRef(null);

  const drawChart = useCallback((width) => {
    const svgRoot = d3.select(svgRef.current);
    svgRoot.selectAll('*').remove();
    
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = width * 0.6 - margin.top - margin.bottom;
    const svgHeight = chartHeight + margin.top + margin.bottom;

    if (!data.length) {
      svgRoot
        .attr("width", width)
        .attr("height", svgHeight)
        .append("text")
        .attr("x", width / 2)
        .attr("y", svgHeight / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#9ca3af")
        .text("尚無已完成的任務");
      return;
    }

    const svg = svgRoot
      .attr("width", width)
      .attr("height", svgHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleUtc()
      .domain(d3.extent(data, d => d.date))
      .range([0, chartWidth]);

    svg.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%m/%d")))
      .attr("font-size", "10px")
      .attr("color", "#6b7280");

    const yMax = d3.max(data, d => d.count) || 1;
    const y = d3.scaleLinear()
      .domain([0, yMax + Math.ceil(yMax * 0.1)])
      .range([chartHeight, 0]);

    svg.append("g")
      .call(d3.axisLeft(y).ticks(Math.min(yMax, 5)).tickFormat(d3.format("d")))
      .attr("font-size", "10px")
      .attr("color", "#6b7280");
      
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 3)
      .attr("d", line);
      
    svg.selectAll("dot")
      .data(data)
      .enter().append("circle")
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.count))
      .attr("r", 5)
      .attr("fill", "#3b82f6")
      .style("cursor", "pointer")
      .append("title")
        .text(d => `完成: ${d.count} (${d3.timeFormat("%Y/%m/%d")(d.date)})`);
  }, [data]);

  // 使用優化的 ResizeObserver
  useResizeObserver(
    chartContainerRef,
    useCallback(({ width }) => {
      if (width > 0) {
        drawChart(width);
      }
    }, [drawChart])
  );

  return (
    <div ref={chartContainerRef} className="w-full h-auto min-h-[150px]">
      <svg ref={svgRef}></svg>
    </div>
  );
}

export default OverviewDashboard;

