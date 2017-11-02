var URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2m4zHV6_3opJl0GwBk2KYynzm2Fjs4MWdtPL5ku7ss7oc1b1CA64667BAfpPDnAd5noyUUnu9x12c/pub?gid=0&single=true&output=csv';
var projects = ['Paye ta planche', 'Acthulhu', 'Red Nugget', 'Au gamer Apaisé', 'La planche a repasser'];
var projects_short = ['PTP', 'ATL', 'RN', 'AGA', 'LPAR'];
var dims = ['blog_vu', 'blog_tm', 'blog_pv', 'blog_np', 'fb_fa', 'fb_p', 'fb_e', 'fb_b', 'fb_np'];
var dims_name = {
    'blog_vu': 'B/Visiteurs',
    'blog_tm': 'B/Temps moyen',
    'blog_pv': 'B/Pages',
    'blog_np': 'Publications',
    'fb_fa': 'FB/Communauté',
    'fb_p': 'FB/Publications',
    'fb_e': 'FB/Engagement',
    'fb_b': 'FB/Budget',
    'fb_np': 'FB/Publications'
};

var color = d3.scaleOrdinal([
    'rgb(31, 119, 180)', // Paye ta planche
    '#3EAD4E', // Acthulu
    'rgb(214, 39, 40)', // Red nugget
    'rgb(255, 127, 14)', // Au gamer apaisé
    'rgb(148, 103, 189)' // La planche à repasser
]);

var tooltip = d3.select('body').append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var formatTime = d3.timeFormat("%Mm%S");
var formatMinutes = function (d) {
    var t = new Date(2012, 0, 1, 0, 0, d);
    return formatTime(t);
};

// The object hold how axes ticks are formatted
var tick_formats = {
    'blog_vu': d3.format(".0f"),
    'blog_tm': formatMinutes,
//        'blog_tm': d3.format(".0s"),
    'blog_tr': d3.format(".0f"),
    'blog_pv': d3.format(".0f"),
    'blog_np': d3.format(".0f"),
    'blog_nz': d3.format("d"),
    'fb_fa': d3.format(".0f"),
    'fb_p': d3.format(".1s"),
    'fb_e': d3.format(".0f"),
    'fb_b': d3.format(".0f"),
    'fb_np': d3.format("d"),
    'tw_fa': d3.format(".0f"),
    'tw_p': d3.format(".1s"),
    'tw_e': d3.format(".0f"),
    'tw_b': d3.format(".0f"),
    'tw_np': d3.format("d"),
    'insta_fa': d3.format(".0f"),
    'insta_p': d3.format(".1s"),
    'insta_e': d3.format(".0f"),
    'insta_b': d3.format(".0s"),
    'insta_np': d3.format("d"),
    'discord_m': d3.format(".0s"),
    'discord_ms': d3.format(".0s"),
    'discord_v': d3.format(".0s"),
    'yt_fa': d3.format(".0s"),
    'yt_v': d3.format(".0s"),
    'yt_t': d3.format(".0s"),
    'blog_agg': d3.format(".0s"),
    'fb_agg': d3.format(".0s"),
    'total_score': d3.format(".0s")
};

// This return an HTML string representing the variation with the previous period
function variation(d, key, weeks, data) {
    var prev_week = -1;
    weeks.forEach(function (w, i) {
        if (w == d.week && i > 0) {
            prev_week = weeks[i - 1];
        }
    });

    var d_prev = data.filter(function (d2) {
        return (d2.week == prev_week && d2.id == d.id);
    })[0];

    if (prev_week >= 0 && d_prev[key]) {
        var diff = d[key] - d_prev[key];
        if (diff > 0) {
            return '(<span class="var_pos">+' + diff / d[key + '_prev'] + '%</span>)';
        } else {
            return '(<span class="var_neg">' + diff / d[key + '_prev'] + '%</span>)';
        }
    } else {
        return '';
    }
}

function legend(elem) {
    var legendRectSize = 15;
    var svg = d3.select('#' + elem).append('svg')
        .attr('width', 960)
        .attr('height', 30);

    var legend = svg.selectAll('.legend')
        .data([1, 2, 3, 4, 5])
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function (d, i) {
            var horz = 0 + i * 180 + 10;
            var vert = 0;
            return 'translate(' + horz + ',' + vert + ')';
        });

    // These are the rectangles
    legend.append('rect')
        .attr('width', legendRectSize)
        .attr('height', legendRectSize)
        .style('fill', color)
        .style('stroke', color);

    // These are the texts
    legend.append('text')
        .attr('x', legendRectSize + 5)
        .attr('y', 15)
        .text(function (d) {
            return projects[d - 1]
        });
}

function draw_radar(data, e, week, scales, selected_projects) {
    $(e).html('');

    data_t = [];
    var cols = [0,1,2,3,4,5]
    var ind = 0;
    data.forEach(function (d) {
        if (d.week == week && $.inArray(d.id, selected_projects) !== -1) {
            o = [];
            dims.forEach(function (dim) {
                o.push({area: dims_name[dim], value: scales[dim](d[dim])})
            });
            data_t.push(o);
            cols[ind] = parseInt(d.id);
            ind += 1
        }
    });
    var mycfg = {
        w: 600,
        h: 600,
        maxValue: 1.0,
        levels: 4,
        ExtraWidthX: 300,
        ExtraWidthY: 300,
        colors: cols,
        color: color,
    };

    console.log(data_t);
    console.log(mycfg.colors);
    if (data_t.length > 0) {
        RadarChart.draw(e, data_t, mycfg);
    }
    else {
        console.log("Not rendering radar chart.");
    }

}

function gen_scale(key, min) {
    return d3.scaleLinear()
        .domain([min ? min : d3.min(data, function (d) {
            return d[key];
        }), d3.max(data, function (d) {
            return d[key];
        })])
        .range([0, 1])
}

function load_data(data_full) {
    data = [];
    data_full.forEach(function (d) {
        dh = parseInt(d[7], 10);
        if (!isNaN(dh)) {
            i = 3;
            data.push({
                'id': d[i++],
                'week': +d[i++],
                'date_start': moment(d[i++], 'DD/MM/YYYY'),
                'date_end': moment(d[i++], 'DD/MM/YYYY'),
                'blog_vu': +d[i++].replace(',', '.'),
                'blog_tm': +d[i++].replace(',', '.'),
                'blog_tr': +(d[i++].replace('%', '').replace(',', '.')),
                'blog_pv': +d[i++].replace(',', '.'),
                'blog_np': +d[i++].replace(',', '.'),
                'blog_nz': +d[i++].replace(',', '.'),
                'fb_fa': +d[i++].replace(',', '.'),
                'fb_p': +d[i++].replace(',', '.'),
                'fb_e': +d[i++].replace(',', '.'),
                'fb_b': +d[i++].replace(',', '.'),
                'fb_np': +d[i++].replace(',', '.'),
                'tw_fa': +d[i++].replace(',', '.'),
                'tw_p': +d[i++].replace(',', '.'),
                'tw_e': +d[i++].replace(',', '.'),
                'tw_b': +d[i++].replace(',', '.'),
                'tw_np': +d[i++].replace(',', '.'),
                'insta_fa': +d[i++].replace(',', '.'),
                'insta_p': +d[i++].replace(',', '.'),
                'insta_e': +d[i++].replace(',', '.'),
                'insta_b': +d[i++].replace(',', '.'),
                'insta_np': +d[i++].replace(',', '.'),
                'discord_m': +d[i++].replace(',', '.'),
                'discord_ms': +d[i++].replace(',', '.'),
                'discord_v': +d[i++].replace(',', '.'),
                'yt_fa': +d[i++].replace(',', '.'),
                'yt_v': +d[i++].replace(',', '.'),
                'yt_t': +d[i++].replace(',', '.'),
                'blog_agg': 0,
                'fb_agg': 0,
                'total_score': 0
            });
        }
    });
    return data;
}

$(function () {
    $(".legend_svg").each(function (index) {
        legend($(this).attr('id'));
    });

    $.get(URL, function (textString) {
        console.log("data loaded");
        var data_full = d3.csvParseRows(textString);
        data = load_data(data_full);

        scales = {};
        // Compute scales
        dims.forEach(function (dim) {
            scales[dim] = gen_scale(dim);
        });

        // Compute weeks
        weeks = d3.nest().key(function (d) {
            return d.week;
        }).entries(data).map(function (d) {
            return d.key;
        });

        // Compute scores
        data.forEach(function (d) {

            d.blog_agg = (scales['blog_vu'](d.blog_vu) +
                scales['blog_tm'](d.blog_tm) +
                scales['blog_pv'](d.blog_pv)) / 3.0 * 100.0;
            d.fb_agg = (scales['blog_vu'](d.blog_vu) +
                scales['blog_tm'](d.blog_tm) +
                scales['blog_pv'](d.blog_pv)) / 3.0 * 100.0;

        });

        // Draw barcharts
        var bc_cfg = {
            color: color,
            weeks: weeks,
        };


        $(".chart").each(function (index) {
            var id = $(this).attr('id');
            GroupedBarChart.draw("#" + id, data, bc_cfg, id);
        });

        // Draw spider/radar chart
        draw_radar(data, '#radar', weeks[weeks.length - 1], scales, []);
    });

    $(".cb_radar").on("change", function () {
        var pr = $('.cb_radar:checked').map(function () {
            return this.value;
        }).get();
        draw_radar(data, '#radar', weeks[weeks.length - 1], scales, pr);
    });
});