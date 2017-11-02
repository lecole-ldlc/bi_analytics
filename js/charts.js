// This is the URL of the google sheet public export
var URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2m4zHV6_3opJl0GwBk2KYynzm2Fjs4MWdtPL5ku7ss7oc1b1CA64667BAfpPDnAd5noyUUnu9x12c/pub?gid=0&single=true&output=csv';

// Projects names
var projects = ['Paye ta planche', 'Acthulhu', 'Red Nugget', 'Au gamer Apaisé', 'La planche a repasser'];

// Projects short names (used in tooltips)
var projects_short = ['PTP', 'ATL', 'RN', 'AGA', 'LPAR'];

// Dimensions used in the spider/radar chart, with associated name
var radar_dims = {
    'blog_vu': 'B/Visiteurs',
    'blog_tm': 'B/Temps moyen',
    'blog_pv': 'B/Pages',
    'blog_np': 'B/Publications',
    'fb_fa': 'FB/Communauté',
    'fb_p': 'FB/Portée',
    'fb_e': 'FB/Engagement',
    'fb_np': 'FB/Publications'
};

// Color scale for projects
var color = d3.scaleOrdinal([
    '#555d68', // Paye ta planche
    '#3EAD4E', // Acthulu
    '#F43131', // Red nugget
    'rgb(255, 127, 14)', // Au gamer apaisé
    'rgb(148, 103, 189)' // La planche à repasser
]);

// Tooltip element used to display additional information
var tooltip = d3.select('body').append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Time formater for duration in minutes/secodes
var formatTime = d3.timeFormat("%Mm%S");
var formatMinutes = function (d) {
    var t = new Date(2012, 0, 1, 0, 0, d);
    return formatTime(t);
};

var percent_format = d3.format("d");

// This object holds how axes ticks are formatted
var tick_formats = {
    'blog_vu': d3.format(".0f"),
    'blog_tm': formatMinutes,
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
    'blog_score': d3.format(".1f"),
    'fb_score': d3.format(".1f"),
    'total_score': d3.format(".1f")
};

// This object holds the minimums of each dimension (used in the linear scales)
var minimums = {
    'blog_vu': 0,
    'blog_tm': 0,
    'blog_tr': 0,
    'blog_pv': 0,
    'blog_np': 0,
    'blog_nz': 0,
    'fb_fa': 0,
    'fb_p': 0,
    'fb_e': 0,
    'fb_b': 0,
    'fb_np': 0,
    'tw_fa': 0,
    'tw_p': 0,
    'tw_e': 0,
    'tw_b': 0,
    'tw_np': 0,
    'insta_fa': 0,
    'insta_p': 0,
    'insta_e': 0,
    'insta_b': 0,
    'insta_np': 0,
    'discord_m': 0,
    'discord_ms': 0,
    'discord_v': 0,
    'yt_fa': 0,
    'yt_v': 0,
    'yt_t': 0,
    'blog_score': 0,
    'fb_score': 0,
    'total_score': 0
};


// This return an HTML string representing the variation with the previous period
function variation(d, key, weeks, data) {
    var prev_week = -1;

    // Get the previous week
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
            return '(<span class="var_pos">+' + percent_format(diff / d_prev[key] * 100) + '%</span>)';
        } else {
            return '(<span class="var_neg">' + percent_format(diff / d_prev[key] * 100) + '%</span>)';
        }
    } else {
        return '';
    }
}

// This function renders a legend (project names and colors) in the "elem" element
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

// Filter the data and renders a radar chart
function draw_radar(data, e, week, selected_projects) {
    $(e).html('');

    data_t = [];
    var cols = [0, 1, 2, 3, 4, 5]
    var ind = 0;
    data.forEach(function (d) {
        if (d.week == week && $.inArray(d.id, selected_projects) !== -1) {
            o = [];
            for (var dim in radar_dims) {
                o.push({area: radar_dims[dim], value: scales[dim](d[dim])})
            }
            data_t.push(o);
            cols[ind] = parseInt(d.id);
            ind += 1
        }
    });
    var mycfg = {
        w: 500,
        h: 500,
        maxValue: 1.0,
        levels: 4,
        ExtraWidthX: 300,
        ExtraWidthY: 300,
        colors: cols,
        color: color,
    };

    //console.log(data_t);
    if (data_t.length > 0) {
        RadarChart.draw(e, data_t, mycfg);
    }
    else {
        console.log("Not rendering radar chart.");
    }

}

function gen_scale(key, min) {
    var min = minimums[key];
    if (minimums[key] == 'min') {
        min = null
    }
    return d3.scaleLinear()
        .domain([min !== null ? min : d3.min(data, function (d) {
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
                'blog_score': 0,
                'fb_score': 0,
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
        for (var dim in tick_formats) {
            scales[dim] = gen_scale(dim);
        }

        // Compute weeks
        weeks = d3.nest().key(function (d) {
            return d.week;
        }).entries(data).map(function (d) {
            return d.key;
        });

        weeks.forEach(function (w) {
            $('#radar_week_select')
                .append($('<option>', {value: w})
                    .text('Semaine ' + w));
        });
        $('select').material_select();

        // Compute scores
        data.forEach(function (d) {

            d.blog_score = (scales['blog_vu'](d.blog_vu) +
                scales['blog_tm'](d.blog_tm) +
                scales['blog_pv'](d.blog_pv)) / 3.0 * 100.0;
            d.fb_score = (scales['fb_fa'](d.fb_fa) +
                scales['fb_p'](d.fb_p) +
                scales['fb_e'](d.fb_e)) / 3.0 * 100.0;
            d.total_score = (d.blog_score + d.fb_score) / 2.0;

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

    });

    $(".cb_radar").on("change", function () {
        var pr = $('.cb_radar:checked').map(function () {
            return this.value;
        }).get();
        draw_radar(data, '#radar', weeks[weeks.length - 1], pr);
    });
});