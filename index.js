'use strict'

var fs = require("fs");
var config, book;

function headingRE(i) {
    return new RegExp("<h" + i + ".*?>(.*?)</h" + i + ">", "g");
};

function parseNode(heading, text) {
    var node = {};
    var r = headingRE(heading).exec(text);
    if (r === null) {
        console.log("Error parsing node '" + text.substr(0, 20) + "...'");
        return {};
    }
    node.title = r[1];
    node.heading = "h" + heading;
    var content = text.substr(r.index + r[0].length);
    var nextRE = headingRE(heading + 1);
    r = nextRE.exec(content);
    if (r !== null) {
        node.content = content.substr(0, r.index);
        node.children = [];
        var lastIndex = r.index;
        while ((r = nextRE.exec(content)) !== null) {
            node.children.push(parseNode(heading + 1, content.substr(lastIndex, r.index - lastIndex)));
            lastIndex = r.index;
        }
        node.children.push(parseNode(heading + 1, content.substr(lastIndex)));
    } else {
        node.content = content;
    }
    return node;
};

module.exports = {
    hooks: {
        "init": function() {
            book = [];
            config = this.options.pluginsConfig.json;
            config.output = config.output || "output.json";
        },
        "finish": function() {
            // Don't know why gitbook does not parse by order
            book.sort(function (a, b) {
                if (a.path === "README.md") return -1;
                if (b.path === "README.md") return 1;
                return a.path < b.path ? -1 : 1;
            });
            fs.writeFileSync(config.output, "\ufeff" + JSON.stringify(book));
        },
        "page:after": function(page) {
            var section = parseNode(1, page.sections[0].content);
            section.path = page.path;
            book.unshift(section);
            return page;
        }
    }
};
