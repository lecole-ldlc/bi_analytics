// This is the URL of the google sheet public export
var URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2m4zHV6_3opJl0GwBk2KYynzm2Fjs4MWdtPL5ku7ss7oc1b1CA64667BAfpPDnAd5noyUUnu9x12c/pub?gid=0&single=true&output=csv';

// Projects names
var projects = ['Paye ta planche', 'Acthulhu', 'Red Nugget', 'Au gamer Apaisé', 'La planche a repasser'];

// Projects short names (used in tooltips)
var projects_short = ['PTP', 'ATL', 'RN', 'AGA', 'LPAR'];

// Dimensions used in the spider/radar chart, with associated name
var radar_dims = {
    'blog_vu': '[Blog] Visiteurs',
    'blog_tm': '[Blog] Temps moyen',
    'blog_pv': '[Blog] Pages',
    'blog_np': '[Blog] Publications',
    'rs_community': '[RS] Communauté',
    'rs_reach': '[RS] Portée',
    'rs_engagement': '[RS] Engagement',
    'rs_publications': '[RS] Publications'
};


// Dimensions used in the scatter plot chart, with associated name
var scatter_dims = {
    'blog_vu': '[Blog] Visiteurs',
    'blog_tm': '[Blog] Temps moyen',
    'blog_pv': '[Blog] Pages',
    'blog_np': '[Blog] Publications',
    'rs_community': '[RS] Communauté',
    'rs_reach': '[RS] Portée',
    'rs_engagement': '[RS] Engagement',
    'rs_publications': '[RS] Publications'
};

scatter_default_x = 'blog_vu';
scatter_default_y = 'rs_publications';

// Color scale for projects
var color = d3.scaleOrdinal([
    '#555d68', // Paye ta planche
    '#3EAD4E', // Acthulu
    '#F43131', // Red nugget
    'rgb(255, 127, 14)', // Au gamer apaisé
    'rgb(148, 103, 189)' // La planche à repasser
]);

var color_text = d3.scaleOrdinal([
    '#ddd', // Paye ta planche
    '#333', // Acthulu
    '#ddd', // Red nugget
    '#333', // Au gamer apaisé
    '#ddd' // La planche à repasser
]);

color_text.domain(['1', '2', '3', '4', '5']);
color.domain(['1', '2', '3', '4', '5']);

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
    'blog_pv': d3.format(".2f"),
    'blog_np': d3.format(".0f"),
    'blog_nz': d3.format("d"),
    'fb_fa': d3.format(".0f"),
    'fb_p': d3.format(".2s"),
    'fb_e': d3.format(".0f"),
    'fb_b': d3.format(".0f"),
    'fb_np': d3.format("d"),
    'tw_fa': d3.format(".0f"),
    'tw_p': d3.format(".2s"),
    'tw_e': d3.format(".0f"),
    'tw_b': d3.format(".0f"),
    'tw_np': d3.format("d"),
    'insta_fa': d3.format(".0f"),
    'insta_p': d3.format(".2s"),
    'insta_e': d3.format(".0f"),
    'insta_b': d3.format(".0s"),
    'insta_np': d3.format("d"),
    'discord_m': d3.format(".0s"),
    'discord_ms': d3.format(".0s"),
    'discord_v': d3.format(".0s"),
    'yt_fa': d3.format(".0s"),
    'yt_v': d3.format(".0s"),
    'yt_t': d3.format(".0s"),
    'rs_community': d3.format("d"),
    'rs_engagement': d3.format("d"),
    'rs_publications': d3.format("d"),
    'rs_budget': d3.format(".1f"),
    'rs_reach': d3.format("d"),
    'blog_score': d3.format(".1f"),
    'rs_score': d3.format(".1f"),
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
    'rs_community': 0,
    'rs_engagement': 0,
    'rs_publications': 0,
    'rs_budget': 0,
    'rs_reach': 0,
    'blog_score': 0,
    'rs_score': 0,
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

    if (prev_week >= 0) {

        var d_prev = data.filter(function (d2) {
            return (d2.week == prev_week && d2.id == d.id);
        })[0];

        if (d_prev && d_prev[key]) {
            var diff = d[key] - d_prev[key];
            if (diff > 0) {
                return '(<span class="var_pos">+' + percent_format(diff / d_prev[key] * 100) + '%</span>)';
            } else if (diff == 0) {
                return '(=)'
            } else {
                return '(<span class="var_neg">' + percent_format(diff / d_prev[key] * 100) + '%</span>)';
            }
        } else {
            return '';
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
function draw_radar(data, e, selected_projects) {
    $(e).html('');

    var week = $("#main_week_select").val();

    data_t = [];
    var cols = [0, 1, 2, 3, 4, 5]
    var ind = 0;
    data.forEach(function (d) {
        if (d.week == week && $.inArray(d.id, selected_projects) !== -1) {
            o = [];
            for (var dim in radar_dims) {
                o.push({area: radar_dims[dim], value: scales[dim](d[dim])})
                console.log(dim, d[dim], scales[dim].domain());
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

    if (data_t.length > 0) {
        console.log(data_t);
        RadarChart.draw(e, data_t, mycfg);
    }
    else {
        console.log("Not rendering radar chart.");
    }

}

function gen_scale(key, min) {
    if (!min) {
        min = minimums[key];
    }

    if (min == 'min') {
        min = null
    }
    return d3.scaleLinear()
        .domain([min !== null ? min : d3.min(data.filter(function (d) {
            return d[key] > 0
        }), function (d) {
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
                'rs_score': 0,
                'total_score': 0
            });
        }
    });

    data.forEach(function (d) {
        for (var property in d) {
            if (d.hasOwnProperty(property)) {
                if (isNaN(d[property])) {
                    d[property] = 0;
                }
            }
        }
    });

    return data;
}

function refresh_charts() {
    // Draw barcharts

    var w = parseInt($("#main_week_select").val());
    var data_f = data.filter(function (d) {
        //return (d.week == w || d.week == w - 1 || d.week == w - 2);
        return true;
    });

    var weeks = d3.nest().key(function (d) {
        return d.week;
    }).entries(data_f).map(function (d) {
        return +d.key;
    });

    var bc_cfg = {
        color: color,
        weeks: weeks,
    };

    var score_cfg = {
        color: color,
        color_text: color_text,
        weeks: weeks,
        week: w,
    };

    $(".chart_bar").each(function (index) {
        var key = $(this).attr('data-key');
        var id = $(this).attr('id');
        //GroupedBarChart.draw("#" + id, data_f, bc_cfg, key);
        ScoreLineChart.draw("#" + id, data_f, score_cfg, key)
    });


    $(".chart_score").each(function (index) {
        var id = $(this).attr('id');
        var key = $(this).attr('data-key');
        ScoreBarChart.draw("#" + id, data_f, score_cfg, key);
    });

    var score_stacked_cfg = {
        weeks: weeks,
        week: w,
    };

    $(".chart_stacked_score").each(function (index) {
        var id = $(this).attr('id');
        var key = $(this).attr('data-key');
        if (key === 'blog_score') {
            parts = ['blog_vu', 'blog_pv', 'blog_tr'];
            coefs = {'blog_vu': 5, 'blog_pv': 3, 'blog_tr': -2};
        } else if (key === 'rs_score') {
            parts = ['rs_community', 'rs_engagement', 'rs_publication', 'rs_budget']
            coefs = {'rs_community': 3, 'rs_engagement': 3, 'rs_publication': 2, 'rs_budget': -2};
        } else if (key === 'total_score') {
            parts = ['blog_score', 'rs_score'];
            coefs = {'blog_score': 1, 'rs_score': 1};
        }
        ScoreStackedBarChart.draw("#" + id, data_f, score_stacked_cfg, parts, coefs);
    });

    $(".chart_stack").each(function (index) {
        var id = $(this).attr('id');
        var key = $(this).attr('data-key');
        if (key === 'rs_community') {
            parts = ['fb_fa', 'insta_fa', 'tw_fa', 'yt_fa', 'discord_fa'];
        } else if (key === 'rs_engagement') {
            parts = ['fb_e', 'insta_e', 'tw_e', 'yt_e', 'discord_e'];
        } else if (key === 'rs_publications') {
            parts = ['fb_np', 'insta_np', 'tw_np', 'yt_np', 'discord_np'];
        } else if (key === 'rs_budget') {
            parts = ['fb_b', 'insta_b', 'tw_b', 'yt_b', 'discord_b'];
        } else if (key === 'rs_reach') {
            parts = ['fb_p', 'insta_p', 'tw_p', 'yt_p', 'discord_p'];
        }
        RsStackedBarChart.draw("#" + id, data_f, score_stacked_cfg, parts);
    });

}

function refresh_scatter() {
    var key_x = $("#scatter_x").val();
    var key_y = $("#scatter_y").val();
    var opt = {
        color: color
    };
    ScatterPlot.draw('#scatter', data, opt, key_x, key_y)
}

$(function () {
    $(".legend_svg").each(function (index) {
        legend($(this).attr('id'));
    });

    $.get(URL, function (textString) {
        console.log("data loaded");
        data_full = d3.csvParseRows(textString);
        data = load_data(data_full);
        scales = {};
        scales_score = {};
        // Compute scales
        for (var dim in tick_formats) {
            scales[dim] = gen_scale(dim);
            scales_score[dim] = gen_scale(dim, 0);
        }
        // Compxute weeks
        var weeks = d3.nest().key(function (d) {
            return d.week;
        }).entries(data).map(function (d) {
            return +d.key;
        });

        weeks.forEach(function (w) {
            $('.week_select')
                .append($('<option>', {value: w})
                    .text(w));
        });

        for (var dim in scatter_dims) {
            $('.scatter_select')
                .append($('<option>', {value: dim})
                    .text(scatter_dims[dim]))
            ;
            $('#scatter_x').val(scatter_default_x);
            $('#scatter_y').val(scatter_default_y);
        }

        // Compute scores
        data.forEach(function (d) {

            d.blog_score = (
                5 * Math.max(0, scales_score['blog_vu'](d.blog_vu))
                + 3 * Math.max(0, scales_score['blog_pv'](d.blog_pv))
                // + scales_score['blog_np'](d.blog_np)
                // + scales_score['blog_nz'](d.blog_nz)
                + 2 * (1 - Math.max(0, scales['blog_tr'](d.blog_tr)))
            ) / 10.0 * 100.0;
            d.rs_community = d.fb_fa + d.tw_fa + d.insta_fa + d.discord_m + d.yt_fa + d.blog_nz;
            d.rs_engagement = d.fb_e + d.tw_e + d.insta_e + d.discord_ms + d.yt_v;
            d.rs_publications = d.fb_np + d.tw_np + d.insta_np;
            d.rs_budget = d.fb_b + d.tw_b;
            d.rs_reach = d.fb_p + d.tw_p + d.insta_p

        });

        scales_score['rs_community'] = gen_scale('rs_community', 0);
        scales_score['rs_engagement'] = gen_scale('rs_engagement', 0);
        scales_score['rs_publications'] = gen_scale('rs_publications', 0);
        scales_score['rs_budget'] = gen_scale('rs_budget', 0);
        scales_score['rs_reach'] = gen_scale('rs_reach', 0);

        scales['rs_community'] = gen_scale('rs_community', 0);
        scales['rs_engagement'] = gen_scale('rs_engagement', 0);
        scales['rs_publications'] = gen_scale('rs_publications', 0);
        scales['rs_budget'] = gen_scale('rs_budget', 0);
        scales['rs_reach'] = gen_scale('rs_reach', 0);

        data.forEach(function (d) {
            d.rs_score = (
                3 * Math.max(0, scales_score['rs_community'](d.rs_community)) +
                3 * Math.max(0, scales_score['rs_engagement'](d.rs_engagement)) +
                2 * Math.max(0, scales_score['rs_publications'](d.rs_publications)) +
                2 * (1 - Math.max(0, scales_score['rs_budget'](d.rs_budget)))
            ) / 8.0 * 100.0;
            // Do not take blog score into account for Gamer Apaisé
        });

        scales_score['blog_score'] = gen_scale('blog_score', 0);
        scales_score['rs_score'] = gen_scale('rs_score', 0);

        data.forEach(function (d) {
            //if (d.id != '4') {
                d.total_score = (
                    scales_score['blog_score'](d.blog_score)
                    + scales_score['blog_score'](d.rs_score)
                ) / 2.0 * 100.0;
            //} else {
            //    d.total_score = (
            //        1 * scales_score['blog_score'](d.blog_score)
            //        + 2 * scales_score['blog_score'](d.rs_score)
            //    ) / 3.0 * 100.0;
            //}
        });

        $('.week_select').val(weeks[weeks.length - 1]);

        refresh_charts();
        refresh_scatter();
        draw_radar(data, '#radar', ['1', '2', '3', '4', '5']);

        var score_hist_cfg = {
            color: color,
        };
        $(".chart_score_hist").each(function (index) {
            var key = $(this).attr('data-key');
            var id = $(this).attr('id');
            ScoreLineChart.draw("#" + id, data, score_hist_cfg, key);
        });

    });

    $(".cb_radar, #main_week_select").on("change", function () {
        var pr = $('.cb_radar:checked').map(function () {
            return this.value;
        }).get();
        draw_radar(data, '#radar', pr);
    });

    $("#main_week_select").on("change", function () {
        refresh_charts();
    });

    $('.scatter_select').on("change", function () {
        refresh_scatter();
    });
});