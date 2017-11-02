var URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2m4zHV6_3opJl0GwBk2KYynzm2Fjs4MWdtPL5ku7ss7oc1b1CA64667BAfpPDnAd5noyUUnu9x12c/pub?gid=0&single=true&output=csv';
var projects = ['Paye ta planche', 'Acthulhu', 'Red Nugget', 'Au gamer Apaisé', 'La planche a repasser']
var projects_short = ['PTP', 'ATL', 'RN', 'AGA', 'LPAR']
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

function variation(d, key) {
    if (d.hasOwnProperty(key + '_prev')) {
        var diff = d[key] - d[key + '_prev'];
        if (diff > 0) {
            return '<span class="var_pos">+' + diff / d[key + '_prev'] + '%</span>';
        } else {
            return '<span class="var_neg">' + diff / d[key + '_prev'] + '%</span>';
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

function draw_grouped_barchart(data, e, key) {

    var w = 300, h = 200;


    var svg = d3.select(e),
        margin = {top: 5, right: 10, bottom: 20, left: 40},
        width = w - margin.left - margin.right,
        height = h - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x0 = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.1);

    var x1 = d3.scaleBand()
        .padding(0.05);

    var y = d3.scaleLinear()
        .rangeRound([height, 0]);

    var weeks = [43]
    x0.domain(weeks);
    keys = [1, 2, 3, 4, 5]
    x1.domain(keys).rangeRound([0, x0.bandwidth()]);
    y.domain([0, d3.max(data, function (d) {
        return d[key];
    })]).nice();
    g.append("g")
        .selectAll("g")
        .data(weeks)
        .enter().append("g")
        .attr("transform", function (d) {
            return "translate(" + x0(d) + ",0)";
        })
        .selectAll("rect")
        .data(data)
        .enter()
        .filter(function (d) {
            return !isNaN(+d[key]);
        })
        .append("rect")
        .attr("x", function (d) {
            return x1(d.id);
        })
        .attr("y", function (d) {
            return y(d[key]);
        })
        .attr("width", x1.bandwidth())
        .attr("height", function (d) {
            return height - y(d[key]);
        })
        .attr("fill", function (d) {
            return color(d.id);
        })
        .on("mouseover", function (d) {
            d3.select(this).transition().duration(100)
                .style("opacity", 0.8)
            tooltip.transition()
                .duration(200)
                .style("opacity", .8);
            tooltip.html(projects_short[d.id - 1] + ' <b>' + d[key] + '</b> (' + variation(d, key) + ')')
                .style("left", d3.event.pageX + "px")
                .style("top", d3.event.pageY + "px");

        })
        .on("mousemove", function (d) {
            tooltip
                .style("left", d3.event.pageX + "px")
                .style("top", d3.event.pageY + "px");

        })
        .on("mouseout", function (d) {
            d3.select(this).transition().duration(100)
                .style("opacity", 1)
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })

    g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (height) + ")")
        .call(d3.axisBottom(x0));

    g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).tickFormat(tick_formats[key]))

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

$(function () {
    $(".legend_svg").each(function (index) {
        legend($(this).attr('id'));
    });

    $.get(URL, function (textString) {
        console.log("data loaded");
        var data_full = d3.csvParseRows(textString)
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
        console.log(data);
        data.forEach(function (d) {
            blog_vu_scale = gen_scale('blog_vu');
            blog_tm_scale = gen_scale('blog_tm');
            blog_pv_scale = gen_scale('blog_pv');
            d.blog_agg = (blog_vu_scale(d.blog_vu) + blog_tm_scale(d.blog_tm) + blog_pv_scale(d.blog_pv)) / 3 * 100;

        });

        $(".chart").each(function (index) {
            var id = $(this).attr('id');
            draw_grouped_barchart(data, "#" + id, id);
        });
    });
});