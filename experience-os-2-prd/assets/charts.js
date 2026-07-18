(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: Readiness Radar ---
  var radarEl = document.getElementById('chart-radar');
  if (radarEl) {
    var chart = echarts.init(radarEl, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      tooltip: {
        trigger: 'item',
        appendToBody: true
      },
      radar: {
        indicator: [
          { name: '建模闭环', max: 10 },
          { name: '生产管道', max: 10 },
          { name: '撞墙反馈', max: 10 },
          { name: '自迭代', max: 10 },
          { name: '人类审查', max: 10 },
          { name: '工程基础', max: 10 }
        ],
        shape: 'polygon',
        splitNumber: 5,
        axisName: {
          color: ink,
          fontSize: 13,
          fontWeight: 600
        },
        splitLine: {
          lineStyle: { color: rule }
        },
        splitArea: {
          areaStyle: {
            color: [bg2, 'transparent']
          }
        },
        axisLine: {
          lineStyle: { color: rule }
        }
      },
      series: [{
        type: 'radar',
        data: [
          {
            value: [8.5, 8.0, 9.0, 8.0, 8.5, 4.0],
            name: '1.0 就绪度',
            areaStyle: {
              color: accent + '33'
            },
            lineStyle: {
              color: accent,
              width: 2
            },
            itemStyle: {
              color: accent
            },
            label: {
              show: true,
              formatter: function(p) { return p.value; },
              color: ink,
              fontSize: 12,
              fontWeight: 600
            }
          },
          {
            value: [9.5, 9.0, 9.5, 9.0, 9.0, 9.0],
            name: '2.0 目标',
            areaStyle: {
              color: accent2 + '22'
            },
            lineStyle: {
              color: accent2,
              width: 2,
              type: 'dashed'
            },
            itemStyle: {
              color: accent2
            }
          }
        ]
      }],
      legend: {
        data: ['1.0 就绪度', '2.0 目标'],
        bottom: 0,
        textStyle: { color: muted, fontSize: 12 },
        itemWidth: 16,
        itemHeight: 8
      }
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }
})();
