var content = (function() {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  var _a, _b;
  function defineContentScript(definition2) {
    return definition2;
  }
  var Readability = { exports: {} };
  var hasRequiredReadability$1;
  function requireReadability$1() {
    if (hasRequiredReadability$1) return Readability.exports;
    hasRequiredReadability$1 = 1;
    (function(module) {
      function Readability2(doc, options) {
        if (options && options.documentElement) {
          doc = options;
          options = arguments[2];
        } else if (!doc || !doc.documentElement) {
          throw new Error("First argument to Readability constructor should be a document object.");
        }
        options = options || {};
        this._doc = doc;
        this._docJSDOMParser = this._doc.firstChild.__JSDOMParser__;
        this._articleTitle = null;
        this._articleByline = null;
        this._articleDir = null;
        this._articleSiteName = null;
        this._attempts = [];
        this._debug = !!options.debug;
        this._maxElemsToParse = options.maxElemsToParse || this.DEFAULT_MAX_ELEMS_TO_PARSE;
        this._nbTopCandidates = options.nbTopCandidates || this.DEFAULT_N_TOP_CANDIDATES;
        this._charThreshold = options.charThreshold || this.DEFAULT_CHAR_THRESHOLD;
        this._classesToPreserve = this.CLASSES_TO_PRESERVE.concat(options.classesToPreserve || []);
        this._keepClasses = !!options.keepClasses;
        this._serializer = options.serializer || function(el) {
          return el.innerHTML;
        };
        this._disableJSONLD = !!options.disableJSONLD;
        this._allowedVideoRegex = options.allowedVideoRegex || this.REGEXPS.videos;
        this._flags = this.FLAG_STRIP_UNLIKELYS | this.FLAG_WEIGHT_CLASSES | this.FLAG_CLEAN_CONDITIONALLY;
        if (this._debug) {
          let logNode = function(node) {
            if (node.nodeType == node.TEXT_NODE) {
              return `${node.nodeName} ("${node.textContent}")`;
            }
            let attrPairs = Array.from(node.attributes || [], function(attr) {
              return `${attr.name}="${attr.value}"`;
            }).join(" ");
            return `<${node.localName} ${attrPairs}>`;
          };
          this.log = function() {
            if (typeof console !== "undefined") {
              let args = Array.from(arguments, (arg) => {
                if (arg && arg.nodeType == this.ELEMENT_NODE) {
                  return logNode(arg);
                }
                return arg;
              });
              args.unshift("Reader: (Readability)");
              console.log.apply(console, args);
            } else if (typeof dump !== "undefined") {
              var msg = Array.prototype.map.call(arguments, function(x) {
                return x && x.nodeName ? logNode(x) : x;
              }).join(" ");
              dump("Reader: (Readability) " + msg + "\n");
            }
          };
        } else {
          this.log = function() {
          };
        }
      }
      Readability2.prototype = {
        FLAG_STRIP_UNLIKELYS: 1,
        FLAG_WEIGHT_CLASSES: 2,
        FLAG_CLEAN_CONDITIONALLY: 4,
        // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
        ELEMENT_NODE: 1,
        TEXT_NODE: 3,
        // Max number of nodes supported by this parser. Default: 0 (no limit)
        DEFAULT_MAX_ELEMS_TO_PARSE: 0,
        // The number of top candidates to consider when analysing how
        // tight the competition is among candidates.
        DEFAULT_N_TOP_CANDIDATES: 5,
        // Element tags to score by default.
        DEFAULT_TAGS_TO_SCORE: "section,h2,h3,h4,h5,h6,p,td,pre".toUpperCase().split(","),
        // The default number of chars an article must have in order to return a result
        DEFAULT_CHAR_THRESHOLD: 500,
        // All of the regular expressions in use within readability.
        // Defined up here so we don't instantiate them repeatedly in loops.
        REGEXPS: {
          // NOTE: These two regular expressions are duplicated in
          // Readability-readerable.js. Please keep both copies in sync.
          unlikelyCandidates: /-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,
          okMaybeItsACandidate: /and|article|body|column|content|main|shadow/i,
          positive: /article|body|content|entry|hentry|h-entry|main|page|pagination|post|text|blog|story/i,
          negative: /-ad-|hidden|^hid$| hid$| hid |^hid |banner|combx|comment|com-|contact|foot|footer|footnote|gdpr|masthead|media|meta|outbrain|promo|related|scroll|share|shoutbox|sidebar|skyscraper|sponsor|shopping|tags|tool|widget/i,
          extraneous: /print|archive|comment|discuss|e[\-]?mail|share|reply|all|login|sign|single|utility/i,
          byline: /byline|author|dateline|writtenby|p-author/i,
          replaceFonts: /<(\/?)font[^>]*>/gi,
          normalize: /\s{2,}/g,
          videos: /\/\/(www\.)?((dailymotion|youtube|youtube-nocookie|player\.vimeo|v\.qq)\.com|(archive|upload\.wikimedia)\.org|player\.twitch\.tv)/i,
          shareElements: /(\b|_)(share|sharedaddy)(\b|_)/i,
          nextLink: /(next|weiter|continue|>([^\|]|$)|»([^\|]|$))/i,
          prevLink: /(prev|earl|old|new|<|«)/i,
          tokenize: /\W+/g,
          whitespace: /^\s*$/,
          hasContent: /\S$/,
          hashUrl: /^#.+/,
          srcsetUrl: /(\S+)(\s+[\d.]+[xw])?(\s*(?:,|$))/g,
          b64DataUrl: /^data:\s*([^\s;,]+)\s*;\s*base64\s*,/i,
          // Commas as used in Latin, Sindhi, Chinese and various other scripts.
          // see: https://en.wikipedia.org/wiki/Comma#Comma_variants
          commas: /\u002C|\u060C|\uFE50|\uFE10|\uFE11|\u2E41|\u2E34|\u2E32|\uFF0C/g,
          // See: https://schema.org/Article
          jsonLdArticleTypes: /^Article|AdvertiserContentArticle|NewsArticle|AnalysisNewsArticle|AskPublicNewsArticle|BackgroundNewsArticle|OpinionNewsArticle|ReportageNewsArticle|ReviewNewsArticle|Report|SatiricalArticle|ScholarlyArticle|MedicalScholarlyArticle|SocialMediaPosting|BlogPosting|LiveBlogPosting|DiscussionForumPosting|TechArticle|APIReference$/
        },
        UNLIKELY_ROLES: ["menu", "menubar", "complementary", "navigation", "alert", "alertdialog", "dialog"],
        DIV_TO_P_ELEMS: /* @__PURE__ */ new Set(["BLOCKQUOTE", "DL", "DIV", "IMG", "OL", "P", "PRE", "TABLE", "UL"]),
        ALTER_TO_DIV_EXCEPTIONS: ["DIV", "ARTICLE", "SECTION", "P"],
        PRESENTATIONAL_ATTRIBUTES: ["align", "background", "bgcolor", "border", "cellpadding", "cellspacing", "frame", "hspace", "rules", "style", "valign", "vspace"],
        DEPRECATED_SIZE_ATTRIBUTE_ELEMS: ["TABLE", "TH", "TD", "HR", "PRE"],
        // The commented out elements qualify as phrasing content but tend to be
        // removed by readability when put into paragraphs, so we ignore them here.
        PHRASING_ELEMS: [
          // "CANVAS", "IFRAME", "SVG", "VIDEO",
          "ABBR",
          "AUDIO",
          "B",
          "BDO",
          "BR",
          "BUTTON",
          "CITE",
          "CODE",
          "DATA",
          "DATALIST",
          "DFN",
          "EM",
          "EMBED",
          "I",
          "IMG",
          "INPUT",
          "KBD",
          "LABEL",
          "MARK",
          "MATH",
          "METER",
          "NOSCRIPT",
          "OBJECT",
          "OUTPUT",
          "PROGRESS",
          "Q",
          "RUBY",
          "SAMP",
          "SCRIPT",
          "SELECT",
          "SMALL",
          "SPAN",
          "STRONG",
          "SUB",
          "SUP",
          "TEXTAREA",
          "TIME",
          "VAR",
          "WBR"
        ],
        // These are the classes that readability sets itself.
        CLASSES_TO_PRESERVE: ["page"],
        // These are the list of HTML entities that need to be escaped.
        HTML_ESCAPE_MAP: {
          "lt": "<",
          "gt": ">",
          "amp": "&",
          "quot": '"',
          "apos": "'"
        },
        /**
         * Run any post-process modifications to article content as necessary.
         *
         * @param Element
         * @return void
        **/
        _postProcessContent: function(articleContent) {
          this._fixRelativeUris(articleContent);
          this._simplifyNestedElements(articleContent);
          if (!this._keepClasses) {
            this._cleanClasses(articleContent);
          }
        },
        /**
         * Iterates over a NodeList, calls `filterFn` for each node and removes node
         * if function returned `true`.
         *
         * If function is not passed, removes all the nodes in node list.
         *
         * @param NodeList nodeList The nodes to operate on
         * @param Function filterFn the function to use as a filter
         * @return void
         */
        _removeNodes: function(nodeList, filterFn) {
          if (this._docJSDOMParser && nodeList._isLiveNodeList) {
            throw new Error("Do not pass live node lists to _removeNodes");
          }
          for (var i = nodeList.length - 1; i >= 0; i--) {
            var node = nodeList[i];
            var parentNode = node.parentNode;
            if (parentNode) {
              if (!filterFn || filterFn.call(this, node, i, nodeList)) {
                parentNode.removeChild(node);
              }
            }
          }
        },
        /**
         * Iterates over a NodeList, and calls _setNodeTag for each node.
         *
         * @param NodeList nodeList The nodes to operate on
         * @param String newTagName the new tag name to use
         * @return void
         */
        _replaceNodeTags: function(nodeList, newTagName) {
          if (this._docJSDOMParser && nodeList._isLiveNodeList) {
            throw new Error("Do not pass live node lists to _replaceNodeTags");
          }
          for (const node of nodeList) {
            this._setNodeTag(node, newTagName);
          }
        },
        /**
         * Iterate over a NodeList, which doesn't natively fully implement the Array
         * interface.
         *
         * For convenience, the current object context is applied to the provided
         * iterate function.
         *
         * @param  NodeList nodeList The NodeList.
         * @param  Function fn       The iterate function.
         * @return void
         */
        _forEachNode: function(nodeList, fn) {
          Array.prototype.forEach.call(nodeList, fn, this);
        },
        /**
         * Iterate over a NodeList, and return the first node that passes
         * the supplied test function
         *
         * For convenience, the current object context is applied to the provided
         * test function.
         *
         * @param  NodeList nodeList The NodeList.
         * @param  Function fn       The test function.
         * @return void
         */
        _findNode: function(nodeList, fn) {
          return Array.prototype.find.call(nodeList, fn, this);
        },
        /**
         * Iterate over a NodeList, return true if any of the provided iterate
         * function calls returns true, false otherwise.
         *
         * For convenience, the current object context is applied to the
         * provided iterate function.
         *
         * @param  NodeList nodeList The NodeList.
         * @param  Function fn       The iterate function.
         * @return Boolean
         */
        _someNode: function(nodeList, fn) {
          return Array.prototype.some.call(nodeList, fn, this);
        },
        /**
         * Iterate over a NodeList, return true if all of the provided iterate
         * function calls return true, false otherwise.
         *
         * For convenience, the current object context is applied to the
         * provided iterate function.
         *
         * @param  NodeList nodeList The NodeList.
         * @param  Function fn       The iterate function.
         * @return Boolean
         */
        _everyNode: function(nodeList, fn) {
          return Array.prototype.every.call(nodeList, fn, this);
        },
        /**
         * Concat all nodelists passed as arguments.
         *
         * @return ...NodeList
         * @return Array
         */
        _concatNodeLists: function() {
          var slice = Array.prototype.slice;
          var args = slice.call(arguments);
          var nodeLists = args.map(function(list) {
            return slice.call(list);
          });
          return Array.prototype.concat.apply([], nodeLists);
        },
        _getAllNodesWithTag: function(node, tagNames) {
          if (node.querySelectorAll) {
            return node.querySelectorAll(tagNames.join(","));
          }
          return [].concat.apply([], tagNames.map(function(tag) {
            var collection = node.getElementsByTagName(tag);
            return Array.isArray(collection) ? collection : Array.from(collection);
          }));
        },
        /**
         * Removes the class="" attribute from every element in the given
         * subtree, except those that match CLASSES_TO_PRESERVE and
         * the classesToPreserve array from the options object.
         *
         * @param Element
         * @return void
         */
        _cleanClasses: function(node) {
          var classesToPreserve = this._classesToPreserve;
          var className = (node.getAttribute("class") || "").split(/\s+/).filter(function(cls) {
            return classesToPreserve.indexOf(cls) != -1;
          }).join(" ");
          if (className) {
            node.setAttribute("class", className);
          } else {
            node.removeAttribute("class");
          }
          for (node = node.firstElementChild; node; node = node.nextElementSibling) {
            this._cleanClasses(node);
          }
        },
        /**
         * Converts each <a> and <img> uri in the given element to an absolute URI,
         * ignoring #ref URIs.
         *
         * @param Element
         * @return void
         */
        _fixRelativeUris: function(articleContent) {
          var baseURI = this._doc.baseURI;
          var documentURI = this._doc.documentURI;
          function toAbsoluteURI(uri) {
            if (baseURI == documentURI && uri.charAt(0) == "#") {
              return uri;
            }
            try {
              return new URL(uri, baseURI).href;
            } catch (ex) {
            }
            return uri;
          }
          var links = this._getAllNodesWithTag(articleContent, ["a"]);
          this._forEachNode(links, function(link) {
            var href = link.getAttribute("href");
            if (href) {
              if (href.indexOf("javascript:") === 0) {
                if (link.childNodes.length === 1 && link.childNodes[0].nodeType === this.TEXT_NODE) {
                  var text = this._doc.createTextNode(link.textContent);
                  link.parentNode.replaceChild(text, link);
                } else {
                  var container = this._doc.createElement("span");
                  while (link.firstChild) {
                    container.appendChild(link.firstChild);
                  }
                  link.parentNode.replaceChild(container, link);
                }
              } else {
                link.setAttribute("href", toAbsoluteURI(href));
              }
            }
          });
          var medias = this._getAllNodesWithTag(articleContent, [
            "img",
            "picture",
            "figure",
            "video",
            "audio",
            "source"
          ]);
          this._forEachNode(medias, function(media) {
            var src = media.getAttribute("src");
            var poster = media.getAttribute("poster");
            var srcset = media.getAttribute("srcset");
            if (src) {
              media.setAttribute("src", toAbsoluteURI(src));
            }
            if (poster) {
              media.setAttribute("poster", toAbsoluteURI(poster));
            }
            if (srcset) {
              var newSrcset = srcset.replace(this.REGEXPS.srcsetUrl, function(_, p1, p2, p3) {
                return toAbsoluteURI(p1) + (p2 || "") + p3;
              });
              media.setAttribute("srcset", newSrcset);
            }
          });
        },
        _simplifyNestedElements: function(articleContent) {
          var node = articleContent;
          while (node) {
            if (node.parentNode && ["DIV", "SECTION"].includes(node.tagName) && !(node.id && node.id.startsWith("readability"))) {
              if (this._isElementWithoutContent(node)) {
                node = this._removeAndGetNext(node);
                continue;
              } else if (this._hasSingleTagInsideElement(node, "DIV") || this._hasSingleTagInsideElement(node, "SECTION")) {
                var child = node.children[0];
                for (var i = 0; i < node.attributes.length; i++) {
                  child.setAttribute(node.attributes[i].name, node.attributes[i].value);
                }
                node.parentNode.replaceChild(child, node);
                node = child;
                continue;
              }
            }
            node = this._getNextNode(node);
          }
        },
        /**
         * Get the article title as an H1.
         *
         * @return string
         **/
        _getArticleTitle: function() {
          var doc = this._doc;
          var curTitle = "";
          var origTitle = "";
          try {
            curTitle = origTitle = doc.title.trim();
            if (typeof curTitle !== "string")
              curTitle = origTitle = this._getInnerText(doc.getElementsByTagName("title")[0]);
          } catch (e) {
          }
          var titleHadHierarchicalSeparators = false;
          function wordCount(str) {
            return str.split(/\s+/).length;
          }
          if (/ [\|\-\\\/>»] /.test(curTitle)) {
            titleHadHierarchicalSeparators = / [\\\/>»] /.test(curTitle);
            curTitle = origTitle.replace(/(.*)[\|\-\\\/>»] .*/gi, "$1");
            if (wordCount(curTitle) < 3)
              curTitle = origTitle.replace(/[^\|\-\\\/>»]*[\|\-\\\/>»](.*)/gi, "$1");
          } else if (curTitle.indexOf(": ") !== -1) {
            var headings = this._concatNodeLists(
              doc.getElementsByTagName("h1"),
              doc.getElementsByTagName("h2")
            );
            var trimmedTitle = curTitle.trim();
            var match = this._someNode(headings, function(heading) {
              return heading.textContent.trim() === trimmedTitle;
            });
            if (!match) {
              curTitle = origTitle.substring(origTitle.lastIndexOf(":") + 1);
              if (wordCount(curTitle) < 3) {
                curTitle = origTitle.substring(origTitle.indexOf(":") + 1);
              } else if (wordCount(origTitle.substr(0, origTitle.indexOf(":"))) > 5) {
                curTitle = origTitle;
              }
            }
          } else if (curTitle.length > 150 || curTitle.length < 15) {
            var hOnes = doc.getElementsByTagName("h1");
            if (hOnes.length === 1)
              curTitle = this._getInnerText(hOnes[0]);
          }
          curTitle = curTitle.trim().replace(this.REGEXPS.normalize, " ");
          var curTitleWordCount = wordCount(curTitle);
          if (curTitleWordCount <= 4 && (!titleHadHierarchicalSeparators || curTitleWordCount != wordCount(origTitle.replace(/[\|\-\\\/>»]+/g, "")) - 1)) {
            curTitle = origTitle;
          }
          return curTitle;
        },
        /**
         * Prepare the HTML document for readability to scrape it.
         * This includes things like stripping javascript, CSS, and handling terrible markup.
         *
         * @return void
         **/
        _prepDocument: function() {
          var doc = this._doc;
          this._removeNodes(this._getAllNodesWithTag(doc, ["style"]));
          if (doc.body) {
            this._replaceBrs(doc.body);
          }
          this._replaceNodeTags(this._getAllNodesWithTag(doc, ["font"]), "SPAN");
        },
        /**
         * Finds the next node, starting from the given node, and ignoring
         * whitespace in between. If the given node is an element, the same node is
         * returned.
         */
        _nextNode: function(node) {
          var next2 = node;
          while (next2 && next2.nodeType != this.ELEMENT_NODE && this.REGEXPS.whitespace.test(next2.textContent)) {
            next2 = next2.nextSibling;
          }
          return next2;
        },
        /**
         * Replaces 2 or more successive <br> elements with a single <p>.
         * Whitespace between <br> elements are ignored. For example:
         *   <div>foo<br>bar<br> <br><br>abc</div>
         * will become:
         *   <div>foo<br>bar<p>abc</p></div>
         */
        _replaceBrs: function(elem) {
          this._forEachNode(this._getAllNodesWithTag(elem, ["br"]), function(br) {
            var next2 = br.nextSibling;
            var replaced = false;
            while ((next2 = this._nextNode(next2)) && next2.tagName == "BR") {
              replaced = true;
              var brSibling = next2.nextSibling;
              next2.parentNode.removeChild(next2);
              next2 = brSibling;
            }
            if (replaced) {
              var p = this._doc.createElement("p");
              br.parentNode.replaceChild(p, br);
              next2 = p.nextSibling;
              while (next2) {
                if (next2.tagName == "BR") {
                  var nextElem = this._nextNode(next2.nextSibling);
                  if (nextElem && nextElem.tagName == "BR")
                    break;
                }
                if (!this._isPhrasingContent(next2))
                  break;
                var sibling = next2.nextSibling;
                p.appendChild(next2);
                next2 = sibling;
              }
              while (p.lastChild && this._isWhitespace(p.lastChild)) {
                p.removeChild(p.lastChild);
              }
              if (p.parentNode.tagName === "P")
                this._setNodeTag(p.parentNode, "DIV");
            }
          });
        },
        _setNodeTag: function(node, tag) {
          this.log("_setNodeTag", node, tag);
          if (this._docJSDOMParser) {
            node.localName = tag.toLowerCase();
            node.tagName = tag.toUpperCase();
            return node;
          }
          var replacement = node.ownerDocument.createElement(tag);
          while (node.firstChild) {
            replacement.appendChild(node.firstChild);
          }
          node.parentNode.replaceChild(replacement, node);
          if (node.readability)
            replacement.readability = node.readability;
          for (var i = 0; i < node.attributes.length; i++) {
            try {
              replacement.setAttribute(node.attributes[i].name, node.attributes[i].value);
            } catch (ex) {
            }
          }
          return replacement;
        },
        /**
         * Prepare the article node for display. Clean out any inline styles,
         * iframes, forms, strip extraneous <p> tags, etc.
         *
         * @param Element
         * @return void
         **/
        _prepArticle: function(articleContent) {
          this._cleanStyles(articleContent);
          this._markDataTables(articleContent);
          this._fixLazyImages(articleContent);
          this._cleanConditionally(articleContent, "form");
          this._cleanConditionally(articleContent, "fieldset");
          this._clean(articleContent, "object");
          this._clean(articleContent, "embed");
          this._clean(articleContent, "footer");
          this._clean(articleContent, "link");
          this._clean(articleContent, "aside");
          var shareElementThreshold = this.DEFAULT_CHAR_THRESHOLD;
          this._forEachNode(articleContent.children, function(topCandidate) {
            this._cleanMatchedNodes(topCandidate, function(node, matchString) {
              return this.REGEXPS.shareElements.test(matchString) && node.textContent.length < shareElementThreshold;
            });
          });
          this._clean(articleContent, "iframe");
          this._clean(articleContent, "input");
          this._clean(articleContent, "textarea");
          this._clean(articleContent, "select");
          this._clean(articleContent, "button");
          this._cleanHeaders(articleContent);
          this._cleanConditionally(articleContent, "table");
          this._cleanConditionally(articleContent, "ul");
          this._cleanConditionally(articleContent, "div");
          this._replaceNodeTags(this._getAllNodesWithTag(articleContent, ["h1"]), "h2");
          this._removeNodes(this._getAllNodesWithTag(articleContent, ["p"]), function(paragraph) {
            var imgCount = paragraph.getElementsByTagName("img").length;
            var embedCount = paragraph.getElementsByTagName("embed").length;
            var objectCount = paragraph.getElementsByTagName("object").length;
            var iframeCount = paragraph.getElementsByTagName("iframe").length;
            var totalCount = imgCount + embedCount + objectCount + iframeCount;
            return totalCount === 0 && !this._getInnerText(paragraph, false);
          });
          this._forEachNode(this._getAllNodesWithTag(articleContent, ["br"]), function(br) {
            var next2 = this._nextNode(br.nextSibling);
            if (next2 && next2.tagName == "P")
              br.parentNode.removeChild(br);
          });
          this._forEachNode(this._getAllNodesWithTag(articleContent, ["table"]), function(table) {
            var tbody = this._hasSingleTagInsideElement(table, "TBODY") ? table.firstElementChild : table;
            if (this._hasSingleTagInsideElement(tbody, "TR")) {
              var row = tbody.firstElementChild;
              if (this._hasSingleTagInsideElement(row, "TD")) {
                var cell = row.firstElementChild;
                cell = this._setNodeTag(cell, this._everyNode(cell.childNodes, this._isPhrasingContent) ? "P" : "DIV");
                table.parentNode.replaceChild(cell, table);
              }
            }
          });
        },
        /**
         * Initialize a node with the readability object. Also checks the
         * className/id for special names to add to its score.
         *
         * @param Element
         * @return void
        **/
        _initializeNode: function(node) {
          node.readability = { "contentScore": 0 };
          switch (node.tagName) {
            case "DIV":
              node.readability.contentScore += 5;
              break;
            case "PRE":
            case "TD":
            case "BLOCKQUOTE":
              node.readability.contentScore += 3;
              break;
            case "ADDRESS":
            case "OL":
            case "UL":
            case "DL":
            case "DD":
            case "DT":
            case "LI":
            case "FORM":
              node.readability.contentScore -= 3;
              break;
            case "H1":
            case "H2":
            case "H3":
            case "H4":
            case "H5":
            case "H6":
            case "TH":
              node.readability.contentScore -= 5;
              break;
          }
          node.readability.contentScore += this._getClassWeight(node);
        },
        _removeAndGetNext: function(node) {
          var nextNode = this._getNextNode(node, true);
          node.parentNode.removeChild(node);
          return nextNode;
        },
        /**
         * Traverse the DOM from node to node, starting at the node passed in.
         * Pass true for the second parameter to indicate this node itself
         * (and its kids) are going away, and we want the next node over.
         *
         * Calling this in a loop will traverse the DOM depth-first.
         */
        _getNextNode: function(node, ignoreSelfAndKids) {
          if (!ignoreSelfAndKids && node.firstElementChild) {
            return node.firstElementChild;
          }
          if (node.nextElementSibling) {
            return node.nextElementSibling;
          }
          do {
            node = node.parentNode;
          } while (node && !node.nextElementSibling);
          return node && node.nextElementSibling;
        },
        // compares second text to first one
        // 1 = same text, 0 = completely different text
        // works the way that it splits both texts into words and then finds words that are unique in second text
        // the result is given by the lower length of unique parts
        _textSimilarity: function(textA, textB) {
          var tokensA = textA.toLowerCase().split(this.REGEXPS.tokenize).filter(Boolean);
          var tokensB = textB.toLowerCase().split(this.REGEXPS.tokenize).filter(Boolean);
          if (!tokensA.length || !tokensB.length) {
            return 0;
          }
          var uniqTokensB = tokensB.filter((token) => !tokensA.includes(token));
          var distanceB = uniqTokensB.join(" ").length / tokensB.join(" ").length;
          return 1 - distanceB;
        },
        _checkByline: function(node, matchString) {
          if (this._articleByline) {
            return false;
          }
          if (node.getAttribute !== void 0) {
            var rel = node.getAttribute("rel");
            var itemprop = node.getAttribute("itemprop");
          }
          if ((rel === "author" || itemprop && itemprop.indexOf("author") !== -1 || this.REGEXPS.byline.test(matchString)) && this._isValidByline(node.textContent)) {
            this._articleByline = node.textContent.trim();
            return true;
          }
          return false;
        },
        _getNodeAncestors: function(node, maxDepth) {
          maxDepth = maxDepth || 0;
          var i = 0, ancestors = [];
          while (node.parentNode) {
            ancestors.push(node.parentNode);
            if (maxDepth && ++i === maxDepth)
              break;
            node = node.parentNode;
          }
          return ancestors;
        },
        /***
         * grabArticle - Using a variety of metrics (content score, classname, element types), find the content that is
         *         most likely to be the stuff a user wants to read. Then return it wrapped up in a div.
         *
         * @param page a document to run upon. Needs to be a full document, complete with body.
         * @return Element
        **/
        _grabArticle: function(page) {
          this.log("**** grabArticle ****");
          var doc = this._doc;
          var isPaging = page !== null;
          page = page ? page : this._doc.body;
          if (!page) {
            this.log("No body found in document. Abort.");
            return null;
          }
          var pageCacheHtml = page.innerHTML;
          while (true) {
            this.log("Starting grabArticle loop");
            var stripUnlikelyCandidates = this._flagIsActive(this.FLAG_STRIP_UNLIKELYS);
            var elementsToScore = [];
            var node = this._doc.documentElement;
            let shouldRemoveTitleHeader = true;
            while (node) {
              if (node.tagName === "HTML") {
                this._articleLang = node.getAttribute("lang");
              }
              var matchString = node.className + " " + node.id;
              if (!this._isProbablyVisible(node)) {
                this.log("Removing hidden node - " + matchString);
                node = this._removeAndGetNext(node);
                continue;
              }
              if (node.getAttribute("aria-modal") == "true" && node.getAttribute("role") == "dialog") {
                node = this._removeAndGetNext(node);
                continue;
              }
              if (this._checkByline(node, matchString)) {
                node = this._removeAndGetNext(node);
                continue;
              }
              if (shouldRemoveTitleHeader && this._headerDuplicatesTitle(node)) {
                this.log("Removing header: ", node.textContent.trim(), this._articleTitle.trim());
                shouldRemoveTitleHeader = false;
                node = this._removeAndGetNext(node);
                continue;
              }
              if (stripUnlikelyCandidates) {
                if (this.REGEXPS.unlikelyCandidates.test(matchString) && !this.REGEXPS.okMaybeItsACandidate.test(matchString) && !this._hasAncestorTag(node, "table") && !this._hasAncestorTag(node, "code") && node.tagName !== "BODY" && node.tagName !== "A") {
                  this.log("Removing unlikely candidate - " + matchString);
                  node = this._removeAndGetNext(node);
                  continue;
                }
                if (this.UNLIKELY_ROLES.includes(node.getAttribute("role"))) {
                  this.log("Removing content with role " + node.getAttribute("role") + " - " + matchString);
                  node = this._removeAndGetNext(node);
                  continue;
                }
              }
              if ((node.tagName === "DIV" || node.tagName === "SECTION" || node.tagName === "HEADER" || node.tagName === "H1" || node.tagName === "H2" || node.tagName === "H3" || node.tagName === "H4" || node.tagName === "H5" || node.tagName === "H6") && this._isElementWithoutContent(node)) {
                node = this._removeAndGetNext(node);
                continue;
              }
              if (this.DEFAULT_TAGS_TO_SCORE.indexOf(node.tagName) !== -1) {
                elementsToScore.push(node);
              }
              if (node.tagName === "DIV") {
                var p = null;
                var childNode = node.firstChild;
                while (childNode) {
                  var nextSibling = childNode.nextSibling;
                  if (this._isPhrasingContent(childNode)) {
                    if (p !== null) {
                      p.appendChild(childNode);
                    } else if (!this._isWhitespace(childNode)) {
                      p = doc.createElement("p");
                      node.replaceChild(p, childNode);
                      p.appendChild(childNode);
                    }
                  } else if (p !== null) {
                    while (p.lastChild && this._isWhitespace(p.lastChild)) {
                      p.removeChild(p.lastChild);
                    }
                    p = null;
                  }
                  childNode = nextSibling;
                }
                if (this._hasSingleTagInsideElement(node, "P") && this._getLinkDensity(node) < 0.25) {
                  var newNode = node.children[0];
                  node.parentNode.replaceChild(newNode, node);
                  node = newNode;
                  elementsToScore.push(node);
                } else if (!this._hasChildBlockElement(node)) {
                  node = this._setNodeTag(node, "P");
                  elementsToScore.push(node);
                }
              }
              node = this._getNextNode(node);
            }
            var candidates = [];
            this._forEachNode(elementsToScore, function(elementToScore) {
              if (!elementToScore.parentNode || typeof elementToScore.parentNode.tagName === "undefined")
                return;
              var innerText = this._getInnerText(elementToScore);
              if (innerText.length < 25)
                return;
              var ancestors2 = this._getNodeAncestors(elementToScore, 5);
              if (ancestors2.length === 0)
                return;
              var contentScore = 0;
              contentScore += 1;
              contentScore += innerText.split(this.REGEXPS.commas).length;
              contentScore += Math.min(Math.floor(innerText.length / 100), 3);
              this._forEachNode(ancestors2, function(ancestor, level) {
                if (!ancestor.tagName || !ancestor.parentNode || typeof ancestor.parentNode.tagName === "undefined")
                  return;
                if (typeof ancestor.readability === "undefined") {
                  this._initializeNode(ancestor);
                  candidates.push(ancestor);
                }
                if (level === 0)
                  var scoreDivider = 1;
                else if (level === 1)
                  scoreDivider = 2;
                else
                  scoreDivider = level * 3;
                ancestor.readability.contentScore += contentScore / scoreDivider;
              });
            });
            var topCandidates = [];
            for (var c = 0, cl = candidates.length; c < cl; c += 1) {
              var candidate = candidates[c];
              var candidateScore = candidate.readability.contentScore * (1 - this._getLinkDensity(candidate));
              candidate.readability.contentScore = candidateScore;
              this.log("Candidate:", candidate, "with score " + candidateScore);
              for (var t = 0; t < this._nbTopCandidates; t++) {
                var aTopCandidate = topCandidates[t];
                if (!aTopCandidate || candidateScore > aTopCandidate.readability.contentScore) {
                  topCandidates.splice(t, 0, candidate);
                  if (topCandidates.length > this._nbTopCandidates)
                    topCandidates.pop();
                  break;
                }
              }
            }
            var topCandidate = topCandidates[0] || null;
            var neededToCreateTopCandidate = false;
            var parentOfTopCandidate;
            if (topCandidate === null || topCandidate.tagName === "BODY") {
              topCandidate = doc.createElement("DIV");
              neededToCreateTopCandidate = true;
              while (page.firstChild) {
                this.log("Moving child out:", page.firstChild);
                topCandidate.appendChild(page.firstChild);
              }
              page.appendChild(topCandidate);
              this._initializeNode(topCandidate);
            } else if (topCandidate) {
              var alternativeCandidateAncestors = [];
              for (var i = 1; i < topCandidates.length; i++) {
                if (topCandidates[i].readability.contentScore / topCandidate.readability.contentScore >= 0.75) {
                  alternativeCandidateAncestors.push(this._getNodeAncestors(topCandidates[i]));
                }
              }
              var MINIMUM_TOPCANDIDATES = 3;
              if (alternativeCandidateAncestors.length >= MINIMUM_TOPCANDIDATES) {
                parentOfTopCandidate = topCandidate.parentNode;
                while (parentOfTopCandidate.tagName !== "BODY") {
                  var listsContainingThisAncestor = 0;
                  for (var ancestorIndex = 0; ancestorIndex < alternativeCandidateAncestors.length && listsContainingThisAncestor < MINIMUM_TOPCANDIDATES; ancestorIndex++) {
                    listsContainingThisAncestor += Number(alternativeCandidateAncestors[ancestorIndex].includes(parentOfTopCandidate));
                  }
                  if (listsContainingThisAncestor >= MINIMUM_TOPCANDIDATES) {
                    topCandidate = parentOfTopCandidate;
                    break;
                  }
                  parentOfTopCandidate = parentOfTopCandidate.parentNode;
                }
              }
              if (!topCandidate.readability) {
                this._initializeNode(topCandidate);
              }
              parentOfTopCandidate = topCandidate.parentNode;
              var lastScore = topCandidate.readability.contentScore;
              var scoreThreshold = lastScore / 3;
              while (parentOfTopCandidate.tagName !== "BODY") {
                if (!parentOfTopCandidate.readability) {
                  parentOfTopCandidate = parentOfTopCandidate.parentNode;
                  continue;
                }
                var parentScore = parentOfTopCandidate.readability.contentScore;
                if (parentScore < scoreThreshold)
                  break;
                if (parentScore > lastScore) {
                  topCandidate = parentOfTopCandidate;
                  break;
                }
                lastScore = parentOfTopCandidate.readability.contentScore;
                parentOfTopCandidate = parentOfTopCandidate.parentNode;
              }
              parentOfTopCandidate = topCandidate.parentNode;
              while (parentOfTopCandidate.tagName != "BODY" && parentOfTopCandidate.children.length == 1) {
                topCandidate = parentOfTopCandidate;
                parentOfTopCandidate = topCandidate.parentNode;
              }
              if (!topCandidate.readability) {
                this._initializeNode(topCandidate);
              }
            }
            var articleContent = doc.createElement("DIV");
            if (isPaging)
              articleContent.id = "readability-content";
            var siblingScoreThreshold = Math.max(10, topCandidate.readability.contentScore * 0.2);
            parentOfTopCandidate = topCandidate.parentNode;
            var siblings = parentOfTopCandidate.children;
            for (var s = 0, sl = siblings.length; s < sl; s++) {
              var sibling = siblings[s];
              var append = false;
              this.log("Looking at sibling node:", sibling, sibling.readability ? "with score " + sibling.readability.contentScore : "");
              this.log("Sibling has score", sibling.readability ? sibling.readability.contentScore : "Unknown");
              if (sibling === topCandidate) {
                append = true;
              } else {
                var contentBonus = 0;
                if (sibling.className === topCandidate.className && topCandidate.className !== "")
                  contentBonus += topCandidate.readability.contentScore * 0.2;
                if (sibling.readability && sibling.readability.contentScore + contentBonus >= siblingScoreThreshold) {
                  append = true;
                } else if (sibling.nodeName === "P") {
                  var linkDensity = this._getLinkDensity(sibling);
                  var nodeContent = this._getInnerText(sibling);
                  var nodeLength = nodeContent.length;
                  if (nodeLength > 80 && linkDensity < 0.25) {
                    append = true;
                  } else if (nodeLength < 80 && nodeLength > 0 && linkDensity === 0 && nodeContent.search(/\.( |$)/) !== -1) {
                    append = true;
                  }
                }
              }
              if (append) {
                this.log("Appending node:", sibling);
                if (this.ALTER_TO_DIV_EXCEPTIONS.indexOf(sibling.nodeName) === -1) {
                  this.log("Altering sibling:", sibling, "to div.");
                  sibling = this._setNodeTag(sibling, "DIV");
                }
                articleContent.appendChild(sibling);
                siblings = parentOfTopCandidate.children;
                s -= 1;
                sl -= 1;
              }
            }
            if (this._debug)
              this.log("Article content pre-prep: " + articleContent.innerHTML);
            this._prepArticle(articleContent);
            if (this._debug)
              this.log("Article content post-prep: " + articleContent.innerHTML);
            if (neededToCreateTopCandidate) {
              topCandidate.id = "readability-page-1";
              topCandidate.className = "page";
            } else {
              var div = doc.createElement("DIV");
              div.id = "readability-page-1";
              div.className = "page";
              while (articleContent.firstChild) {
                div.appendChild(articleContent.firstChild);
              }
              articleContent.appendChild(div);
            }
            if (this._debug)
              this.log("Article content after paging: " + articleContent.innerHTML);
            var parseSuccessful = true;
            var textLength = this._getInnerText(articleContent, true).length;
            if (textLength < this._charThreshold) {
              parseSuccessful = false;
              page.innerHTML = pageCacheHtml;
              if (this._flagIsActive(this.FLAG_STRIP_UNLIKELYS)) {
                this._removeFlag(this.FLAG_STRIP_UNLIKELYS);
                this._attempts.push({ articleContent, textLength });
              } else if (this._flagIsActive(this.FLAG_WEIGHT_CLASSES)) {
                this._removeFlag(this.FLAG_WEIGHT_CLASSES);
                this._attempts.push({ articleContent, textLength });
              } else if (this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY)) {
                this._removeFlag(this.FLAG_CLEAN_CONDITIONALLY);
                this._attempts.push({ articleContent, textLength });
              } else {
                this._attempts.push({ articleContent, textLength });
                this._attempts.sort(function(a, b) {
                  return b.textLength - a.textLength;
                });
                if (!this._attempts[0].textLength) {
                  return null;
                }
                articleContent = this._attempts[0].articleContent;
                parseSuccessful = true;
              }
            }
            if (parseSuccessful) {
              var ancestors = [parentOfTopCandidate, topCandidate].concat(this._getNodeAncestors(parentOfTopCandidate));
              this._someNode(ancestors, function(ancestor) {
                if (!ancestor.tagName)
                  return false;
                var articleDir = ancestor.getAttribute("dir");
                if (articleDir) {
                  this._articleDir = articleDir;
                  return true;
                }
                return false;
              });
              return articleContent;
            }
          }
        },
        /**
         * Check whether the input string could be a byline.
         * This verifies that the input is a string, and that the length
         * is less than 100 chars.
         *
         * @param possibleByline {string} - a string to check whether its a byline.
         * @return Boolean - whether the input string is a byline.
         */
        _isValidByline: function(byline) {
          if (typeof byline == "string" || byline instanceof String) {
            byline = byline.trim();
            return byline.length > 0 && byline.length < 100;
          }
          return false;
        },
        /**
         * Converts some of the common HTML entities in string to their corresponding characters.
         *
         * @param str {string} - a string to unescape.
         * @return string without HTML entity.
         */
        _unescapeHtmlEntities: function(str) {
          if (!str) {
            return str;
          }
          var htmlEscapeMap = this.HTML_ESCAPE_MAP;
          return str.replace(/&(quot|amp|apos|lt|gt);/g, function(_, tag) {
            return htmlEscapeMap[tag];
          }).replace(/&#(?:x([0-9a-z]{1,4})|([0-9]{1,4}));/gi, function(_, hex, numStr) {
            var num = parseInt(hex || numStr, hex ? 16 : 10);
            return String.fromCharCode(num);
          });
        },
        /**
         * Try to extract metadata from JSON-LD object.
         * For now, only Schema.org objects of type Article or its subtypes are supported.
         * @return Object with any metadata that could be extracted (possibly none)
         */
        _getJSONLD: function(doc) {
          var scripts = this._getAllNodesWithTag(doc, ["script"]);
          var metadata;
          this._forEachNode(scripts, function(jsonLdElement) {
            if (!metadata && jsonLdElement.getAttribute("type") === "application/ld+json") {
              try {
                var content2 = jsonLdElement.textContent.replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, "");
                var parsed = JSON.parse(content2);
                if (!parsed["@context"] || !parsed["@context"].match(/^https?\:\/\/schema\.org$/)) {
                  return;
                }
                if (!parsed["@type"] && Array.isArray(parsed["@graph"])) {
                  parsed = parsed["@graph"].find(function(it) {
                    return (it["@type"] || "").match(
                      this.REGEXPS.jsonLdArticleTypes
                    );
                  });
                }
                if (!parsed || !parsed["@type"] || !parsed["@type"].match(this.REGEXPS.jsonLdArticleTypes)) {
                  return;
                }
                metadata = {};
                if (typeof parsed.name === "string" && typeof parsed.headline === "string" && parsed.name !== parsed.headline) {
                  var title = this._getArticleTitle();
                  var nameMatches = this._textSimilarity(parsed.name, title) > 0.75;
                  var headlineMatches = this._textSimilarity(parsed.headline, title) > 0.75;
                  if (headlineMatches && !nameMatches) {
                    metadata.title = parsed.headline;
                  } else {
                    metadata.title = parsed.name;
                  }
                } else if (typeof parsed.name === "string") {
                  metadata.title = parsed.name.trim();
                } else if (typeof parsed.headline === "string") {
                  metadata.title = parsed.headline.trim();
                }
                if (parsed.author) {
                  if (typeof parsed.author.name === "string") {
                    metadata.byline = parsed.author.name.trim();
                  } else if (Array.isArray(parsed.author) && parsed.author[0] && typeof parsed.author[0].name === "string") {
                    metadata.byline = parsed.author.filter(function(author) {
                      return author && typeof author.name === "string";
                    }).map(function(author) {
                      return author.name.trim();
                    }).join(", ");
                  }
                }
                if (typeof parsed.description === "string") {
                  metadata.excerpt = parsed.description.trim();
                }
                if (parsed.publisher && typeof parsed.publisher.name === "string") {
                  metadata.siteName = parsed.publisher.name.trim();
                }
                if (typeof parsed.datePublished === "string") {
                  metadata.datePublished = parsed.datePublished.trim();
                }
                return;
              } catch (err) {
                this.log(err.message);
              }
            }
          });
          return metadata ? metadata : {};
        },
        /**
         * Attempts to get excerpt and byline metadata for the article.
         *
         * @param {Object} jsonld — object containing any metadata that
         * could be extracted from JSON-LD object.
         *
         * @return Object with optional "excerpt" and "byline" properties
         */
        _getArticleMetadata: function(jsonld) {
          var metadata = {};
          var values = {};
          var metaElements = this._doc.getElementsByTagName("meta");
          var propertyPattern = /\s*(article|dc|dcterm|og|twitter)\s*:\s*(author|creator|description|published_time|title|site_name)\s*/gi;
          var namePattern = /^\s*(?:(dc|dcterm|og|twitter|weibo:(article|webpage))\s*[\.:]\s*)?(author|creator|description|title|site_name)\s*$/i;
          this._forEachNode(metaElements, function(element) {
            var elementName = element.getAttribute("name");
            var elementProperty = element.getAttribute("property");
            var content2 = element.getAttribute("content");
            if (!content2) {
              return;
            }
            var matches = null;
            var name = null;
            if (elementProperty) {
              matches = elementProperty.match(propertyPattern);
              if (matches) {
                name = matches[0].toLowerCase().replace(/\s/g, "");
                values[name] = content2.trim();
              }
            }
            if (!matches && elementName && namePattern.test(elementName)) {
              name = elementName;
              if (content2) {
                name = name.toLowerCase().replace(/\s/g, "").replace(/\./g, ":");
                values[name] = content2.trim();
              }
            }
          });
          metadata.title = jsonld.title || values["dc:title"] || values["dcterm:title"] || values["og:title"] || values["weibo:article:title"] || values["weibo:webpage:title"] || values["title"] || values["twitter:title"];
          if (!metadata.title) {
            metadata.title = this._getArticleTitle();
          }
          metadata.byline = jsonld.byline || values["dc:creator"] || values["dcterm:creator"] || values["author"];
          metadata.excerpt = jsonld.excerpt || values["dc:description"] || values["dcterm:description"] || values["og:description"] || values["weibo:article:description"] || values["weibo:webpage:description"] || values["description"] || values["twitter:description"];
          metadata.siteName = jsonld.siteName || values["og:site_name"];
          metadata.publishedTime = jsonld.datePublished || values["article:published_time"] || null;
          metadata.title = this._unescapeHtmlEntities(metadata.title);
          metadata.byline = this._unescapeHtmlEntities(metadata.byline);
          metadata.excerpt = this._unescapeHtmlEntities(metadata.excerpt);
          metadata.siteName = this._unescapeHtmlEntities(metadata.siteName);
          metadata.publishedTime = this._unescapeHtmlEntities(metadata.publishedTime);
          return metadata;
        },
        /**
         * Check if node is image, or if node contains exactly only one image
         * whether as a direct child or as its descendants.
         *
         * @param Element
        **/
        _isSingleImage: function(node) {
          if (node.tagName === "IMG") {
            return true;
          }
          if (node.children.length !== 1 || node.textContent.trim() !== "") {
            return false;
          }
          return this._isSingleImage(node.children[0]);
        },
        /**
         * Find all <noscript> that are located after <img> nodes, and which contain only one
         * <img> element. Replace the first image with the image from inside the <noscript> tag,
         * and remove the <noscript> tag. This improves the quality of the images we use on
         * some sites (e.g. Medium).
         *
         * @param Element
        **/
        _unwrapNoscriptImages: function(doc) {
          var imgs = Array.from(doc.getElementsByTagName("img"));
          this._forEachNode(imgs, function(img) {
            for (var i = 0; i < img.attributes.length; i++) {
              var attr = img.attributes[i];
              switch (attr.name) {
                case "src":
                case "srcset":
                case "data-src":
                case "data-srcset":
                  return;
              }
              if (/\.(jpg|jpeg|png|webp)/i.test(attr.value)) {
                return;
              }
            }
            img.parentNode.removeChild(img);
          });
          var noscripts = Array.from(doc.getElementsByTagName("noscript"));
          this._forEachNode(noscripts, function(noscript) {
            var tmp = doc.createElement("div");
            tmp.innerHTML = noscript.innerHTML;
            if (!this._isSingleImage(tmp)) {
              return;
            }
            var prevElement = noscript.previousElementSibling;
            if (prevElement && this._isSingleImage(prevElement)) {
              var prevImg = prevElement;
              if (prevImg.tagName !== "IMG") {
                prevImg = prevElement.getElementsByTagName("img")[0];
              }
              var newImg = tmp.getElementsByTagName("img")[0];
              for (var i = 0; i < prevImg.attributes.length; i++) {
                var attr = prevImg.attributes[i];
                if (attr.value === "") {
                  continue;
                }
                if (attr.name === "src" || attr.name === "srcset" || /\.(jpg|jpeg|png|webp)/i.test(attr.value)) {
                  if (newImg.getAttribute(attr.name) === attr.value) {
                    continue;
                  }
                  var attrName = attr.name;
                  if (newImg.hasAttribute(attrName)) {
                    attrName = "data-old-" + attrName;
                  }
                  newImg.setAttribute(attrName, attr.value);
                }
              }
              noscript.parentNode.replaceChild(tmp.firstElementChild, prevElement);
            }
          });
        },
        /**
         * Removes script tags from the document.
         *
         * @param Element
        **/
        _removeScripts: function(doc) {
          this._removeNodes(this._getAllNodesWithTag(doc, ["script", "noscript"]));
        },
        /**
         * Check if this node has only whitespace and a single element with given tag
         * Returns false if the DIV node contains non-empty text nodes
         * or if it contains no element with given tag or more than 1 element.
         *
         * @param Element
         * @param string tag of child element
        **/
        _hasSingleTagInsideElement: function(element, tag) {
          if (element.children.length != 1 || element.children[0].tagName !== tag) {
            return false;
          }
          return !this._someNode(element.childNodes, function(node) {
            return node.nodeType === this.TEXT_NODE && this.REGEXPS.hasContent.test(node.textContent);
          });
        },
        _isElementWithoutContent: function(node) {
          return node.nodeType === this.ELEMENT_NODE && node.textContent.trim().length == 0 && (node.children.length == 0 || node.children.length == node.getElementsByTagName("br").length + node.getElementsByTagName("hr").length);
        },
        /**
         * Determine whether element has any children block level elements.
         *
         * @param Element
         */
        _hasChildBlockElement: function(element) {
          return this._someNode(element.childNodes, function(node) {
            return this.DIV_TO_P_ELEMS.has(node.tagName) || this._hasChildBlockElement(node);
          });
        },
        /***
         * Determine if a node qualifies as phrasing content.
         * https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Phrasing_content
        **/
        _isPhrasingContent: function(node) {
          return node.nodeType === this.TEXT_NODE || this.PHRASING_ELEMS.indexOf(node.tagName) !== -1 || (node.tagName === "A" || node.tagName === "DEL" || node.tagName === "INS") && this._everyNode(node.childNodes, this._isPhrasingContent);
        },
        _isWhitespace: function(node) {
          return node.nodeType === this.TEXT_NODE && node.textContent.trim().length === 0 || node.nodeType === this.ELEMENT_NODE && node.tagName === "BR";
        },
        /**
         * Get the inner text of a node - cross browser compatibly.
         * This also strips out any excess whitespace to be found.
         *
         * @param Element
         * @param Boolean normalizeSpaces (default: true)
         * @return string
        **/
        _getInnerText: function(e, normalizeSpaces) {
          normalizeSpaces = typeof normalizeSpaces === "undefined" ? true : normalizeSpaces;
          var textContent = e.textContent.trim();
          if (normalizeSpaces) {
            return textContent.replace(this.REGEXPS.normalize, " ");
          }
          return textContent;
        },
        /**
         * Get the number of times a string s appears in the node e.
         *
         * @param Element
         * @param string - what to split on. Default is ","
         * @return number (integer)
        **/
        _getCharCount: function(e, s) {
          s = s || ",";
          return this._getInnerText(e).split(s).length - 1;
        },
        /**
         * Remove the style attribute on every e and under.
         * TODO: Test if getElementsByTagName(*) is faster.
         *
         * @param Element
         * @return void
        **/
        _cleanStyles: function(e) {
          if (!e || e.tagName.toLowerCase() === "svg")
            return;
          for (var i = 0; i < this.PRESENTATIONAL_ATTRIBUTES.length; i++) {
            e.removeAttribute(this.PRESENTATIONAL_ATTRIBUTES[i]);
          }
          if (this.DEPRECATED_SIZE_ATTRIBUTE_ELEMS.indexOf(e.tagName) !== -1) {
            e.removeAttribute("width");
            e.removeAttribute("height");
          }
          var cur = e.firstElementChild;
          while (cur !== null) {
            this._cleanStyles(cur);
            cur = cur.nextElementSibling;
          }
        },
        /**
         * Get the density of links as a percentage of the content
         * This is the amount of text that is inside a link divided by the total text in the node.
         *
         * @param Element
         * @return number (float)
        **/
        _getLinkDensity: function(element) {
          var textLength = this._getInnerText(element).length;
          if (textLength === 0)
            return 0;
          var linkLength = 0;
          this._forEachNode(element.getElementsByTagName("a"), function(linkNode) {
            var href = linkNode.getAttribute("href");
            var coefficient = href && this.REGEXPS.hashUrl.test(href) ? 0.3 : 1;
            linkLength += this._getInnerText(linkNode).length * coefficient;
          });
          return linkLength / textLength;
        },
        /**
         * Get an elements class/id weight. Uses regular expressions to tell if this
         * element looks good or bad.
         *
         * @param Element
         * @return number (Integer)
        **/
        _getClassWeight: function(e) {
          if (!this._flagIsActive(this.FLAG_WEIGHT_CLASSES))
            return 0;
          var weight = 0;
          if (typeof e.className === "string" && e.className !== "") {
            if (this.REGEXPS.negative.test(e.className))
              weight -= 25;
            if (this.REGEXPS.positive.test(e.className))
              weight += 25;
          }
          if (typeof e.id === "string" && e.id !== "") {
            if (this.REGEXPS.negative.test(e.id))
              weight -= 25;
            if (this.REGEXPS.positive.test(e.id))
              weight += 25;
          }
          return weight;
        },
        /**
         * Clean a node of all elements of type "tag".
         * (Unless it's a youtube/vimeo video. People love movies.)
         *
         * @param Element
         * @param string tag to clean
         * @return void
         **/
        _clean: function(e, tag) {
          var isEmbed = ["object", "embed", "iframe"].indexOf(tag) !== -1;
          this._removeNodes(this._getAllNodesWithTag(e, [tag]), function(element) {
            if (isEmbed) {
              for (var i = 0; i < element.attributes.length; i++) {
                if (this._allowedVideoRegex.test(element.attributes[i].value)) {
                  return false;
                }
              }
              if (element.tagName === "object" && this._allowedVideoRegex.test(element.innerHTML)) {
                return false;
              }
            }
            return true;
          });
        },
        /**
         * Check if a given node has one of its ancestor tag name matching the
         * provided one.
         * @param  HTMLElement node
         * @param  String      tagName
         * @param  Number      maxDepth
         * @param  Function    filterFn a filter to invoke to determine whether this node 'counts'
         * @return Boolean
         */
        _hasAncestorTag: function(node, tagName, maxDepth, filterFn) {
          maxDepth = maxDepth || 3;
          tagName = tagName.toUpperCase();
          var depth = 0;
          while (node.parentNode) {
            if (maxDepth > 0 && depth > maxDepth)
              return false;
            if (node.parentNode.tagName === tagName && (!filterFn || filterFn(node.parentNode)))
              return true;
            node = node.parentNode;
            depth++;
          }
          return false;
        },
        /**
         * Return an object indicating how many rows and columns this table has.
         */
        _getRowAndColumnCount: function(table) {
          var rows = 0;
          var columns = 0;
          var trs = table.getElementsByTagName("tr");
          for (var i = 0; i < trs.length; i++) {
            var rowspan = trs[i].getAttribute("rowspan") || 0;
            if (rowspan) {
              rowspan = parseInt(rowspan, 10);
            }
            rows += rowspan || 1;
            var columnsInThisRow = 0;
            var cells = trs[i].getElementsByTagName("td");
            for (var j = 0; j < cells.length; j++) {
              var colspan = cells[j].getAttribute("colspan") || 0;
              if (colspan) {
                colspan = parseInt(colspan, 10);
              }
              columnsInThisRow += colspan || 1;
            }
            columns = Math.max(columns, columnsInThisRow);
          }
          return { rows, columns };
        },
        /**
         * Look for 'data' (as opposed to 'layout') tables, for which we use
         * similar checks as
         * https://searchfox.org/mozilla-central/rev/f82d5c549f046cb64ce5602bfd894b7ae807c8f8/accessible/generic/TableAccessible.cpp#19
         */
        _markDataTables: function(root2) {
          var tables = root2.getElementsByTagName("table");
          for (var i = 0; i < tables.length; i++) {
            var table = tables[i];
            var role = table.getAttribute("role");
            if (role == "presentation") {
              table._readabilityDataTable = false;
              continue;
            }
            var datatable = table.getAttribute("datatable");
            if (datatable == "0") {
              table._readabilityDataTable = false;
              continue;
            }
            var summary = table.getAttribute("summary");
            if (summary) {
              table._readabilityDataTable = true;
              continue;
            }
            var caption = table.getElementsByTagName("caption")[0];
            if (caption && caption.childNodes.length > 0) {
              table._readabilityDataTable = true;
              continue;
            }
            var dataTableDescendants = ["col", "colgroup", "tfoot", "thead", "th"];
            var descendantExists = function(tag) {
              return !!table.getElementsByTagName(tag)[0];
            };
            if (dataTableDescendants.some(descendantExists)) {
              this.log("Data table because found data-y descendant");
              table._readabilityDataTable = true;
              continue;
            }
            if (table.getElementsByTagName("table")[0]) {
              table._readabilityDataTable = false;
              continue;
            }
            var sizeInfo = this._getRowAndColumnCount(table);
            if (sizeInfo.rows >= 10 || sizeInfo.columns > 4) {
              table._readabilityDataTable = true;
              continue;
            }
            table._readabilityDataTable = sizeInfo.rows * sizeInfo.columns > 10;
          }
        },
        /* convert images and figures that have properties like data-src into images that can be loaded without JS */
        _fixLazyImages: function(root2) {
          this._forEachNode(this._getAllNodesWithTag(root2, ["img", "picture", "figure"]), function(elem) {
            if (elem.src && this.REGEXPS.b64DataUrl.test(elem.src)) {
              var parts = this.REGEXPS.b64DataUrl.exec(elem.src);
              if (parts[1] === "image/svg+xml") {
                return;
              }
              var srcCouldBeRemoved = false;
              for (var i = 0; i < elem.attributes.length; i++) {
                var attr = elem.attributes[i];
                if (attr.name === "src") {
                  continue;
                }
                if (/\.(jpg|jpeg|png|webp)/i.test(attr.value)) {
                  srcCouldBeRemoved = true;
                  break;
                }
              }
              if (srcCouldBeRemoved) {
                var b64starts = elem.src.search(/base64\s*/i) + 7;
                var b64length = elem.src.length - b64starts;
                if (b64length < 133) {
                  elem.removeAttribute("src");
                }
              }
            }
            if ((elem.src || elem.srcset && elem.srcset != "null") && elem.className.toLowerCase().indexOf("lazy") === -1) {
              return;
            }
            for (var j = 0; j < elem.attributes.length; j++) {
              attr = elem.attributes[j];
              if (attr.name === "src" || attr.name === "srcset" || attr.name === "alt") {
                continue;
              }
              var copyTo = null;
              if (/\.(jpg|jpeg|png|webp)\s+\d/.test(attr.value)) {
                copyTo = "srcset";
              } else if (/^\s*\S+\.(jpg|jpeg|png|webp)\S*\s*$/.test(attr.value)) {
                copyTo = "src";
              }
              if (copyTo) {
                if (elem.tagName === "IMG" || elem.tagName === "PICTURE") {
                  elem.setAttribute(copyTo, attr.value);
                } else if (elem.tagName === "FIGURE" && !this._getAllNodesWithTag(elem, ["img", "picture"]).length) {
                  var img = this._doc.createElement("img");
                  img.setAttribute(copyTo, attr.value);
                  elem.appendChild(img);
                }
              }
            }
          });
        },
        _getTextDensity: function(e, tags) {
          var textLength = this._getInnerText(e, true).length;
          if (textLength === 0) {
            return 0;
          }
          var childrenLength = 0;
          var children = this._getAllNodesWithTag(e, tags);
          this._forEachNode(children, (child) => childrenLength += this._getInnerText(child, true).length);
          return childrenLength / textLength;
        },
        /**
         * Clean an element of all tags of type "tag" if they look fishy.
         * "Fishy" is an algorithm based on content length, classnames, link density, number of images & embeds, etc.
         *
         * @return void
         **/
        _cleanConditionally: function(e, tag) {
          if (!this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY))
            return;
          this._removeNodes(this._getAllNodesWithTag(e, [tag]), function(node) {
            var isDataTable = function(t) {
              return t._readabilityDataTable;
            };
            var isList = tag === "ul" || tag === "ol";
            if (!isList) {
              var listLength = 0;
              var listNodes = this._getAllNodesWithTag(node, ["ul", "ol"]);
              this._forEachNode(listNodes, (list) => listLength += this._getInnerText(list).length);
              isList = listLength / this._getInnerText(node).length > 0.9;
            }
            if (tag === "table" && isDataTable(node)) {
              return false;
            }
            if (this._hasAncestorTag(node, "table", -1, isDataTable)) {
              return false;
            }
            if (this._hasAncestorTag(node, "code")) {
              return false;
            }
            var weight = this._getClassWeight(node);
            this.log("Cleaning Conditionally", node);
            var contentScore = 0;
            if (weight + contentScore < 0) {
              return true;
            }
            if (this._getCharCount(node, ",") < 10) {
              var p = node.getElementsByTagName("p").length;
              var img = node.getElementsByTagName("img").length;
              var li = node.getElementsByTagName("li").length - 100;
              var input = node.getElementsByTagName("input").length;
              var headingDensity = this._getTextDensity(node, ["h1", "h2", "h3", "h4", "h5", "h6"]);
              var embedCount = 0;
              var embeds = this._getAllNodesWithTag(node, ["object", "embed", "iframe"]);
              for (var i = 0; i < embeds.length; i++) {
                for (var j = 0; j < embeds[i].attributes.length; j++) {
                  if (this._allowedVideoRegex.test(embeds[i].attributes[j].value)) {
                    return false;
                  }
                }
                if (embeds[i].tagName === "object" && this._allowedVideoRegex.test(embeds[i].innerHTML)) {
                  return false;
                }
                embedCount++;
              }
              var linkDensity = this._getLinkDensity(node);
              var contentLength = this._getInnerText(node).length;
              var haveToRemove = img > 1 && p / img < 0.5 && !this._hasAncestorTag(node, "figure") || !isList && li > p || input > Math.floor(p / 3) || !isList && headingDensity < 0.9 && contentLength < 25 && (img === 0 || img > 2) && !this._hasAncestorTag(node, "figure") || !isList && weight < 25 && linkDensity > 0.2 || weight >= 25 && linkDensity > 0.5 || (embedCount === 1 && contentLength < 75 || embedCount > 1);
              if (isList && haveToRemove) {
                for (var x = 0; x < node.children.length; x++) {
                  let child = node.children[x];
                  if (child.children.length > 1) {
                    return haveToRemove;
                  }
                }
                let li_count = node.getElementsByTagName("li").length;
                if (img == li_count) {
                  return false;
                }
              }
              return haveToRemove;
            }
            return false;
          });
        },
        /**
         * Clean out elements that match the specified conditions
         *
         * @param Element
         * @param Function determines whether a node should be removed
         * @return void
         **/
        _cleanMatchedNodes: function(e, filter) {
          var endOfSearchMarkerNode = this._getNextNode(e, true);
          var next2 = this._getNextNode(e);
          while (next2 && next2 != endOfSearchMarkerNode) {
            if (filter.call(this, next2, next2.className + " " + next2.id)) {
              next2 = this._removeAndGetNext(next2);
            } else {
              next2 = this._getNextNode(next2);
            }
          }
        },
        /**
         * Clean out spurious headers from an Element.
         *
         * @param Element
         * @return void
        **/
        _cleanHeaders: function(e) {
          let headingNodes = this._getAllNodesWithTag(e, ["h1", "h2"]);
          this._removeNodes(headingNodes, function(node) {
            let shouldRemove = this._getClassWeight(node) < 0;
            if (shouldRemove) {
              this.log("Removing header with low class weight:", node);
            }
            return shouldRemove;
          });
        },
        /**
         * Check if this node is an H1 or H2 element whose content is mostly
         * the same as the article title.
         *
         * @param Element  the node to check.
         * @return boolean indicating whether this is a title-like header.
         */
        _headerDuplicatesTitle: function(node) {
          if (node.tagName != "H1" && node.tagName != "H2") {
            return false;
          }
          var heading = this._getInnerText(node, false);
          this.log("Evaluating similarity of header:", heading, this._articleTitle);
          return this._textSimilarity(this._articleTitle, heading) > 0.75;
        },
        _flagIsActive: function(flag) {
          return (this._flags & flag) > 0;
        },
        _removeFlag: function(flag) {
          this._flags = this._flags & ~flag;
        },
        _isProbablyVisible: function(node) {
          return (!node.style || node.style.display != "none") && (!node.style || node.style.visibility != "hidden") && !node.hasAttribute("hidden") && (!node.hasAttribute("aria-hidden") || node.getAttribute("aria-hidden") != "true" || node.className && node.className.indexOf && node.className.indexOf("fallback-image") !== -1);
        },
        /**
         * Runs readability.
         *
         * Workflow:
         *  1. Prep the document by removing script tags, css, etc.
         *  2. Build readability's DOM tree.
         *  3. Grab the article content from the current dom tree.
         *  4. Replace the current DOM tree with the new one.
         *  5. Read peacefully.
         *
         * @return void
         **/
        parse: function() {
          if (this._maxElemsToParse > 0) {
            var numTags = this._doc.getElementsByTagName("*").length;
            if (numTags > this._maxElemsToParse) {
              throw new Error("Aborting parsing document; " + numTags + " elements found");
            }
          }
          this._unwrapNoscriptImages(this._doc);
          var jsonLd = this._disableJSONLD ? {} : this._getJSONLD(this._doc);
          this._removeScripts(this._doc);
          this._prepDocument();
          var metadata = this._getArticleMetadata(jsonLd);
          this._articleTitle = metadata.title;
          var articleContent = this._grabArticle();
          if (!articleContent)
            return null;
          this.log("Grabbed: " + articleContent.innerHTML);
          this._postProcessContent(articleContent);
          if (!metadata.excerpt) {
            var paragraphs = articleContent.getElementsByTagName("p");
            if (paragraphs.length > 0) {
              metadata.excerpt = paragraphs[0].textContent.trim();
            }
          }
          var textContent = articleContent.textContent;
          return {
            title: this._articleTitle,
            byline: metadata.byline || this._articleByline,
            dir: this._articleDir,
            lang: this._articleLang,
            content: this._serializer(articleContent),
            textContent,
            length: textContent.length,
            excerpt: metadata.excerpt,
            siteName: metadata.siteName || this._articleSiteName,
            publishedTime: metadata.publishedTime
          };
        }
      };
      {
        module.exports = Readability2;
      }
    })(Readability);
    return Readability.exports;
  }
  var ReadabilityReaderable = { exports: {} };
  var hasRequiredReadabilityReaderable;
  function requireReadabilityReaderable() {
    if (hasRequiredReadabilityReaderable) return ReadabilityReaderable.exports;
    hasRequiredReadabilityReaderable = 1;
    (function(module) {
      var REGEXPS = {
        // NOTE: These two regular expressions are duplicated in
        // Readability.js. Please keep both copies in sync.
        unlikelyCandidates: /-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,
        okMaybeItsACandidate: /and|article|body|column|content|main|shadow/i
      };
      function isNodeVisible(node) {
        return (!node.style || node.style.display != "none") && !node.hasAttribute("hidden") && (!node.hasAttribute("aria-hidden") || node.getAttribute("aria-hidden") != "true" || node.className && node.className.indexOf && node.className.indexOf("fallback-image") !== -1);
      }
      function isProbablyReaderable(doc, options = {}) {
        if (typeof options == "function") {
          options = { visibilityChecker: options };
        }
        var defaultOptions = { minScore: 20, minContentLength: 140, visibilityChecker: isNodeVisible };
        options = Object.assign(defaultOptions, options);
        var nodes = doc.querySelectorAll("p, pre, article");
        var brNodes = doc.querySelectorAll("div > br");
        if (brNodes.length) {
          var set = new Set(nodes);
          [].forEach.call(brNodes, function(node) {
            set.add(node.parentNode);
          });
          nodes = Array.from(set);
        }
        var score = 0;
        return [].some.call(nodes, function(node) {
          if (!options.visibilityChecker(node)) {
            return false;
          }
          var matchString = node.className + " " + node.id;
          if (REGEXPS.unlikelyCandidates.test(matchString) && !REGEXPS.okMaybeItsACandidate.test(matchString)) {
            return false;
          }
          if (node.matches("li p")) {
            return false;
          }
          var textContentLength = node.textContent.trim().length;
          if (textContentLength < options.minContentLength) {
            return false;
          }
          score += Math.sqrt(textContentLength - options.minContentLength);
          if (score > options.minScore) {
            return true;
          }
          return false;
        });
      }
      {
        module.exports = isProbablyReaderable;
      }
    })(ReadabilityReaderable);
    return ReadabilityReaderable.exports;
  }
  var readability;
  var hasRequiredReadability;
  function requireReadability() {
    if (hasRequiredReadability) return readability;
    hasRequiredReadability = 1;
    var Readability2 = requireReadability$1();
    var isProbablyReaderable = requireReadabilityReaderable();
    readability = {
      Readability: Readability2,
      isProbablyReaderable
    };
    return readability;
  }
  var readabilityExports = requireReadability();
  function extend(destination) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (source.hasOwnProperty(key)) destination[key] = source[key];
      }
    }
    return destination;
  }
  function repeat(character, count) {
    return Array(count + 1).join(character);
  }
  function trimLeadingNewlines(string) {
    return string.replace(/^\n*/, "");
  }
  function trimTrailingNewlines(string) {
    var indexEnd = string.length;
    while (indexEnd > 0 && string[indexEnd - 1] === "\n") indexEnd--;
    return string.substring(0, indexEnd);
  }
  function trimNewlines(string) {
    return trimTrailingNewlines(trimLeadingNewlines(string));
  }
  var blockElements = [
    "ADDRESS",
    "ARTICLE",
    "ASIDE",
    "AUDIO",
    "BLOCKQUOTE",
    "BODY",
    "CANVAS",
    "CENTER",
    "DD",
    "DIR",
    "DIV",
    "DL",
    "DT",
    "FIELDSET",
    "FIGCAPTION",
    "FIGURE",
    "FOOTER",
    "FORM",
    "FRAMESET",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "HEADER",
    "HGROUP",
    "HR",
    "HTML",
    "ISINDEX",
    "LI",
    "MAIN",
    "MENU",
    "NAV",
    "NOFRAMES",
    "NOSCRIPT",
    "OL",
    "OUTPUT",
    "P",
    "PRE",
    "SECTION",
    "TABLE",
    "TBODY",
    "TD",
    "TFOOT",
    "TH",
    "THEAD",
    "TR",
    "UL"
  ];
  function isBlock(node) {
    return is(node, blockElements);
  }
  var voidElements = [
    "AREA",
    "BASE",
    "BR",
    "COL",
    "COMMAND",
    "EMBED",
    "HR",
    "IMG",
    "INPUT",
    "KEYGEN",
    "LINK",
    "META",
    "PARAM",
    "SOURCE",
    "TRACK",
    "WBR"
  ];
  function isVoid(node) {
    return is(node, voidElements);
  }
  function hasVoid(node) {
    return has(node, voidElements);
  }
  var meaningfulWhenBlankElements = [
    "A",
    "TABLE",
    "THEAD",
    "TBODY",
    "TFOOT",
    "TH",
    "TD",
    "IFRAME",
    "SCRIPT",
    "AUDIO",
    "VIDEO"
  ];
  function isMeaningfulWhenBlank(node) {
    return is(node, meaningfulWhenBlankElements);
  }
  function hasMeaningfulWhenBlank(node) {
    return has(node, meaningfulWhenBlankElements);
  }
  function is(node, tagNames) {
    return tagNames.indexOf(node.nodeName) >= 0;
  }
  function has(node, tagNames) {
    return node.getElementsByTagName && tagNames.some(function(tagName) {
      return node.getElementsByTagName(tagName).length;
    });
  }
  var rules = {};
  rules.paragraph = {
    filter: "p",
    replacement: function(content2) {
      return "\n\n" + content2 + "\n\n";
    }
  };
  rules.lineBreak = {
    filter: "br",
    replacement: function(content2, node, options) {
      return options.br + "\n";
    }
  };
  rules.heading = {
    filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
    replacement: function(content2, node, options) {
      var hLevel = Number(node.nodeName.charAt(1));
      if (options.headingStyle === "setext" && hLevel < 3) {
        var underline = repeat(hLevel === 1 ? "=" : "-", content2.length);
        return "\n\n" + content2 + "\n" + underline + "\n\n";
      } else {
        return "\n\n" + repeat("#", hLevel) + " " + content2 + "\n\n";
      }
    }
  };
  rules.blockquote = {
    filter: "blockquote",
    replacement: function(content2) {
      content2 = trimNewlines(content2).replace(/^/gm, "> ");
      return "\n\n" + content2 + "\n\n";
    }
  };
  rules.list = {
    filter: ["ul", "ol"],
    replacement: function(content2, node) {
      var parent = node.parentNode;
      if (parent.nodeName === "LI" && parent.lastElementChild === node) {
        return "\n" + content2;
      } else {
        return "\n\n" + content2 + "\n\n";
      }
    }
  };
  rules.listItem = {
    filter: "li",
    replacement: function(content2, node, options) {
      var prefix = options.bulletListMarker + "   ";
      var parent = node.parentNode;
      if (parent.nodeName === "OL") {
        var start = parent.getAttribute("start");
        var index = Array.prototype.indexOf.call(parent.children, node);
        prefix = (start ? Number(start) + index : index + 1) + ".  ";
      }
      var isParagraph = /\n$/.test(content2);
      content2 = trimNewlines(content2) + (isParagraph ? "\n" : "");
      content2 = content2.replace(/\n/gm, "\n" + " ".repeat(prefix.length));
      return prefix + content2 + (node.nextSibling ? "\n" : "");
    }
  };
  rules.indentedCodeBlock = {
    filter: function(node, options) {
      return options.codeBlockStyle === "indented" && node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE";
    },
    replacement: function(content2, node, options) {
      return "\n\n    " + node.firstChild.textContent.replace(/\n/g, "\n    ") + "\n\n";
    }
  };
  rules.fencedCodeBlock = {
    filter: function(node, options) {
      return options.codeBlockStyle === "fenced" && node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE";
    },
    replacement: function(content2, node, options) {
      var className = node.firstChild.getAttribute("class") || "";
      var language = (className.match(/language-(\S+)/) || [null, ""])[1];
      var code = node.firstChild.textContent;
      var fenceChar = options.fence.charAt(0);
      var fenceSize = 3;
      var fenceInCodeRegex = new RegExp("^" + fenceChar + "{3,}", "gm");
      var match;
      while (match = fenceInCodeRegex.exec(code)) {
        if (match[0].length >= fenceSize) {
          fenceSize = match[0].length + 1;
        }
      }
      var fence = repeat(fenceChar, fenceSize);
      return "\n\n" + fence + language + "\n" + code.replace(/\n$/, "") + "\n" + fence + "\n\n";
    }
  };
  rules.horizontalRule = {
    filter: "hr",
    replacement: function(content2, node, options) {
      return "\n\n" + options.hr + "\n\n";
    }
  };
  rules.inlineLink = {
    filter: function(node, options) {
      return options.linkStyle === "inlined" && node.nodeName === "A" && node.getAttribute("href");
    },
    replacement: function(content2, node) {
      var href = node.getAttribute("href");
      if (href) href = href.replace(/([()])/g, "\\$1");
      var title = cleanAttribute(node.getAttribute("title"));
      if (title) title = ' "' + title.replace(/"/g, '\\"') + '"';
      return "[" + content2 + "](" + href + title + ")";
    }
  };
  rules.referenceLink = {
    filter: function(node, options) {
      return options.linkStyle === "referenced" && node.nodeName === "A" && node.getAttribute("href");
    },
    replacement: function(content2, node, options) {
      var href = node.getAttribute("href");
      var title = cleanAttribute(node.getAttribute("title"));
      if (title) title = ' "' + title + '"';
      var replacement;
      var reference;
      switch (options.linkReferenceStyle) {
        case "collapsed":
          replacement = "[" + content2 + "][]";
          reference = "[" + content2 + "]: " + href + title;
          break;
        case "shortcut":
          replacement = "[" + content2 + "]";
          reference = "[" + content2 + "]: " + href + title;
          break;
        default:
          var id = this.references.length + 1;
          replacement = "[" + content2 + "][" + id + "]";
          reference = "[" + id + "]: " + href + title;
      }
      this.references.push(reference);
      return replacement;
    },
    references: [],
    append: function(options) {
      var references = "";
      if (this.references.length) {
        references = "\n\n" + this.references.join("\n") + "\n\n";
        this.references = [];
      }
      return references;
    }
  };
  rules.emphasis = {
    filter: ["em", "i"],
    replacement: function(content2, node, options) {
      if (!content2.trim()) return "";
      return options.emDelimiter + content2 + options.emDelimiter;
    }
  };
  rules.strong = {
    filter: ["strong", "b"],
    replacement: function(content2, node, options) {
      if (!content2.trim()) return "";
      return options.strongDelimiter + content2 + options.strongDelimiter;
    }
  };
  rules.code = {
    filter: function(node) {
      var hasSiblings = node.previousSibling || node.nextSibling;
      var isCodeBlock = node.parentNode.nodeName === "PRE" && !hasSiblings;
      return node.nodeName === "CODE" && !isCodeBlock;
    },
    replacement: function(content2) {
      if (!content2) return "";
      content2 = content2.replace(/\r?\n|\r/g, " ");
      var extraSpace = /^`|^ .*?[^ ].* $|`$/.test(content2) ? " " : "";
      var delimiter = "`";
      var matches = content2.match(/`+/gm) || [];
      while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + "`";
      return delimiter + extraSpace + content2 + extraSpace + delimiter;
    }
  };
  rules.image = {
    filter: "img",
    replacement: function(content2, node) {
      var alt = cleanAttribute(node.getAttribute("alt"));
      var src = node.getAttribute("src") || "";
      var title = cleanAttribute(node.getAttribute("title"));
      var titlePart = title ? ' "' + title + '"' : "";
      return src ? "![" + alt + "](" + src + titlePart + ")" : "";
    }
  };
  function cleanAttribute(attribute) {
    return attribute ? attribute.replace(/(\n+\s*)+/g, "\n") : "";
  }
  function Rules(options) {
    this.options = options;
    this._keep = [];
    this._remove = [];
    this.blankRule = {
      replacement: options.blankReplacement
    };
    this.keepReplacement = options.keepReplacement;
    this.defaultRule = {
      replacement: options.defaultReplacement
    };
    this.array = [];
    for (var key in options.rules) this.array.push(options.rules[key]);
  }
  Rules.prototype = {
    add: function(key, rule) {
      this.array.unshift(rule);
    },
    keep: function(filter) {
      this._keep.unshift({
        filter,
        replacement: this.keepReplacement
      });
    },
    remove: function(filter) {
      this._remove.unshift({
        filter,
        replacement: function() {
          return "";
        }
      });
    },
    forNode: function(node) {
      if (node.isBlank) return this.blankRule;
      var rule;
      if (rule = findRule(this.array, node, this.options)) return rule;
      if (rule = findRule(this._keep, node, this.options)) return rule;
      if (rule = findRule(this._remove, node, this.options)) return rule;
      return this.defaultRule;
    },
    forEach: function(fn) {
      for (var i = 0; i < this.array.length; i++) fn(this.array[i], i);
    }
  };
  function findRule(rules2, node, options) {
    for (var i = 0; i < rules2.length; i++) {
      var rule = rules2[i];
      if (filterValue(rule, node, options)) return rule;
    }
    return void 0;
  }
  function filterValue(rule, node, options) {
    var filter = rule.filter;
    if (typeof filter === "string") {
      if (filter === node.nodeName.toLowerCase()) return true;
    } else if (Array.isArray(filter)) {
      if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true;
    } else if (typeof filter === "function") {
      if (filter.call(rule, node, options)) return true;
    } else {
      throw new TypeError("`filter` needs to be a string, array, or function");
    }
  }
  function collapseWhitespace(options) {
    var element = options.element;
    var isBlock2 = options.isBlock;
    var isVoid2 = options.isVoid;
    var isPre = options.isPre || function(node2) {
      return node2.nodeName === "PRE";
    };
    if (!element.firstChild || isPre(element)) return;
    var prevText = null;
    var keepLeadingWs = false;
    var prev = null;
    var node = next(prev, element, isPre);
    while (node !== element) {
      if (node.nodeType === 3 || node.nodeType === 4) {
        var text = node.data.replace(/[ \r\n\t]+/g, " ");
        if ((!prevText || / $/.test(prevText.data)) && !keepLeadingWs && text[0] === " ") {
          text = text.substr(1);
        }
        if (!text) {
          node = remove(node);
          continue;
        }
        node.data = text;
        prevText = node;
      } else if (node.nodeType === 1) {
        if (isBlock2(node) || node.nodeName === "BR") {
          if (prevText) {
            prevText.data = prevText.data.replace(/ $/, "");
          }
          prevText = null;
          keepLeadingWs = false;
        } else if (isVoid2(node) || isPre(node)) {
          prevText = null;
          keepLeadingWs = true;
        } else if (prevText) {
          keepLeadingWs = false;
        }
      } else {
        node = remove(node);
        continue;
      }
      var nextNode = next(prev, node, isPre);
      prev = node;
      node = nextNode;
    }
    if (prevText) {
      prevText.data = prevText.data.replace(/ $/, "");
      if (!prevText.data) {
        remove(prevText);
      }
    }
  }
  function remove(node) {
    var next2 = node.nextSibling || node.parentNode;
    node.parentNode.removeChild(node);
    return next2;
  }
  function next(prev, current, isPre) {
    if (prev && prev.parentNode === current || isPre(current)) {
      return current.nextSibling || current.parentNode;
    }
    return current.firstChild || current.nextSibling || current.parentNode;
  }
  var root = typeof window !== "undefined" ? window : {};
  function canParseHTMLNatively() {
    var Parser = root.DOMParser;
    var canParse = false;
    try {
      if (new Parser().parseFromString("", "text/html")) {
        canParse = true;
      }
    } catch (e) {
    }
    return canParse;
  }
  function createHTMLParser() {
    var Parser = function() {
    };
    {
      if (shouldUseActiveX()) {
        Parser.prototype.parseFromString = function(string) {
          var doc = new window.ActiveXObject("htmlfile");
          doc.designMode = "on";
          doc.open();
          doc.write(string);
          doc.close();
          return doc;
        };
      } else {
        Parser.prototype.parseFromString = function(string) {
          var doc = document.implementation.createHTMLDocument("");
          doc.open();
          doc.write(string);
          doc.close();
          return doc;
        };
      }
    }
    return Parser;
  }
  function shouldUseActiveX() {
    var useActiveX = false;
    try {
      document.implementation.createHTMLDocument("").open();
    } catch (e) {
      if (root.ActiveXObject) useActiveX = true;
    }
    return useActiveX;
  }
  var HTMLParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser();
  function RootNode(input, options) {
    var root2;
    if (typeof input === "string") {
      var doc = htmlParser().parseFromString(
        // DOM parsers arrange elements in the <head> and <body>.
        // Wrapping in a custom element ensures elements are reliably arranged in
        // a single element.
        '<x-turndown id="turndown-root">' + input + "</x-turndown>",
        "text/html"
      );
      root2 = doc.getElementById("turndown-root");
    } else {
      root2 = input.cloneNode(true);
    }
    collapseWhitespace({
      element: root2,
      isBlock,
      isVoid,
      isPre: options.preformattedCode ? isPreOrCode : null
    });
    return root2;
  }
  var _htmlParser;
  function htmlParser() {
    _htmlParser = _htmlParser || new HTMLParser();
    return _htmlParser;
  }
  function isPreOrCode(node) {
    return node.nodeName === "PRE" || node.nodeName === "CODE";
  }
  function Node(node, options) {
    node.isBlock = isBlock(node);
    node.isCode = node.nodeName === "CODE" || node.parentNode.isCode;
    node.isBlank = isBlank(node);
    node.flankingWhitespace = flankingWhitespace(node, options);
    return node;
  }
  function isBlank(node) {
    return !isVoid(node) && !isMeaningfulWhenBlank(node) && /^\s*$/i.test(node.textContent) && !hasVoid(node) && !hasMeaningfulWhenBlank(node);
  }
  function flankingWhitespace(node, options) {
    if (node.isBlock || options.preformattedCode && node.isCode) {
      return { leading: "", trailing: "" };
    }
    var edges = edgeWhitespace(node.textContent);
    if (edges.leadingAscii && isFlankedByWhitespace("left", node, options)) {
      edges.leading = edges.leadingNonAscii;
    }
    if (edges.trailingAscii && isFlankedByWhitespace("right", node, options)) {
      edges.trailing = edges.trailingNonAscii;
    }
    return { leading: edges.leading, trailing: edges.trailing };
  }
  function edgeWhitespace(string) {
    var m = string.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/);
    return {
      leading: m[1],
      // whole string for whitespace-only strings
      leadingAscii: m[2],
      leadingNonAscii: m[3],
      trailing: m[4],
      // empty for whitespace-only strings
      trailingNonAscii: m[5],
      trailingAscii: m[6]
    };
  }
  function isFlankedByWhitespace(side, node, options) {
    var sibling;
    var regExp;
    var isFlanked;
    if (side === "left") {
      sibling = node.previousSibling;
      regExp = / $/;
    } else {
      sibling = node.nextSibling;
      regExp = /^ /;
    }
    if (sibling) {
      if (sibling.nodeType === 3) {
        isFlanked = regExp.test(sibling.nodeValue);
      } else if (options.preformattedCode && sibling.nodeName === "CODE") {
        isFlanked = false;
      } else if (sibling.nodeType === 1 && !isBlock(sibling)) {
        isFlanked = regExp.test(sibling.textContent);
      }
    }
    return isFlanked;
  }
  var reduce = Array.prototype.reduce;
  var escapes = [
    [/\\/g, "\\\\"],
    [/\*/g, "\\*"],
    [/^-/g, "\\-"],
    [/^\+ /g, "\\+ "],
    [/^(=+)/g, "\\$1"],
    [/^(#{1,6}) /g, "\\$1 "],
    [/`/g, "\\`"],
    [/^~~~/g, "\\~~~"],
    [/\[/g, "\\["],
    [/\]/g, "\\]"],
    [/^>/g, "\\>"],
    [/_/g, "\\_"],
    [/^(\d+)\. /g, "$1\\. "]
  ];
  function TurndownService(options) {
    if (!(this instanceof TurndownService)) return new TurndownService(options);
    var defaults = {
      rules,
      headingStyle: "setext",
      hr: "* * *",
      bulletListMarker: "*",
      codeBlockStyle: "indented",
      fence: "```",
      emDelimiter: "_",
      strongDelimiter: "**",
      linkStyle: "inlined",
      linkReferenceStyle: "full",
      br: "  ",
      preformattedCode: false,
      blankReplacement: function(content2, node) {
        return node.isBlock ? "\n\n" : "";
      },
      keepReplacement: function(content2, node) {
        return node.isBlock ? "\n\n" + node.outerHTML + "\n\n" : node.outerHTML;
      },
      defaultReplacement: function(content2, node) {
        return node.isBlock ? "\n\n" + content2 + "\n\n" : content2;
      }
    };
    this.options = extend({}, defaults, options);
    this.rules = new Rules(this.options);
  }
  TurndownService.prototype = {
    /**
     * The entry point for converting a string or DOM node to Markdown
     * @public
     * @param {String|HTMLElement} input The string or DOM node to convert
     * @returns A Markdown representation of the input
     * @type String
     */
    turndown: function(input) {
      if (!canConvert(input)) {
        throw new TypeError(
          input + " is not a string, or an element/document/fragment node."
        );
      }
      if (input === "") return "";
      var output = process.call(this, new RootNode(input, this.options));
      return postProcess.call(this, output);
    },
    /**
     * Add one or more plugins
     * @public
     * @param {Function|Array} plugin The plugin or array of plugins to add
     * @returns The Turndown instance for chaining
     * @type Object
     */
    use: function(plugin) {
      if (Array.isArray(plugin)) {
        for (var i = 0; i < plugin.length; i++) this.use(plugin[i]);
      } else if (typeof plugin === "function") {
        plugin(this);
      } else {
        throw new TypeError("plugin must be a Function or an Array of Functions");
      }
      return this;
    },
    /**
     * Adds a rule
     * @public
     * @param {String} key The unique key of the rule
     * @param {Object} rule The rule
     * @returns The Turndown instance for chaining
     * @type Object
     */
    addRule: function(key, rule) {
      this.rules.add(key, rule);
      return this;
    },
    /**
     * Keep a node (as HTML) that matches the filter
     * @public
     * @param {String|Array|Function} filter The unique key of the rule
     * @returns The Turndown instance for chaining
     * @type Object
     */
    keep: function(filter) {
      this.rules.keep(filter);
      return this;
    },
    /**
     * Remove a node that matches the filter
     * @public
     * @param {String|Array|Function} filter The unique key of the rule
     * @returns The Turndown instance for chaining
     * @type Object
     */
    remove: function(filter) {
      this.rules.remove(filter);
      return this;
    },
    /**
     * Escapes Markdown syntax
     * @public
     * @param {String} string The string to escape
     * @returns A string with Markdown syntax escaped
     * @type String
     */
    escape: function(string) {
      return escapes.reduce(function(accumulator, escape) {
        return accumulator.replace(escape[0], escape[1]);
      }, string);
    }
  };
  function process(parentNode) {
    var self = this;
    return reduce.call(parentNode.childNodes, function(output, node) {
      node = new Node(node, self.options);
      var replacement = "";
      if (node.nodeType === 3) {
        replacement = node.isCode ? node.nodeValue : self.escape(node.nodeValue);
      } else if (node.nodeType === 1) {
        replacement = replacementForNode.call(self, node);
      }
      return join(output, replacement);
    }, "");
  }
  function postProcess(output) {
    var self = this;
    this.rules.forEach(function(rule) {
      if (typeof rule.append === "function") {
        output = join(output, rule.append(self.options));
      }
    });
    return output.replace(/^[\t\r\n]+/, "").replace(/[\t\r\n\s]+$/, "");
  }
  function replacementForNode(node) {
    var rule = this.rules.forNode(node);
    var content2 = process.call(this, node);
    var whitespace = node.flankingWhitespace;
    if (whitespace.leading || whitespace.trailing) content2 = content2.trim();
    return whitespace.leading + rule.replacement(content2, node, this.options) + whitespace.trailing;
  }
  function join(output, replacement) {
    var s1 = trimTrailingNewlines(output);
    var s2 = trimLeadingNewlines(replacement);
    var nls = Math.max(output.length - s1.length, replacement.length - s2.length);
    var separator = "\n\n".substring(0, nls);
    return s1 + separator + s2;
  }
  function canConvert(input) {
    return input != null && (typeof input === "string" || input.nodeType && (input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11));
  }
  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced"
  });
  async function extractPageContent() {
    const documentClone = document.cloneNode(true);
    const reader = new readabilityExports.Readability(documentClone);
    const article = reader.parse();
    if (!article) {
      return {
        title: document.title,
        url: window.location.href,
        markdown: document.body.innerText.slice(0, 8e3),
        wordCount: document.body.innerText.split(/\s+/).length
      };
    }
    const markdown = turndownService.turndown(article.content);
    return {
      title: article.title,
      url: window.location.href,
      markdown,
      wordCount: article.length,
      siteName: article.siteName || void 0
    };
  }
  content;
  function isContentImage(img) {
    const { width, height, src } = img;
    if (width < 100 || height < 100) return false;
    const skipPatterns = ["avatar", "logo", "icon", "emoji", "badge", "button"];
    return !skipPatterns.some((pattern) => src.toLowerCase().includes(pattern));
  }
  async function compressAndEncode(img) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const maxSize = 1024;
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = height / width * maxSize;
          width = maxSize;
        } else {
          width = width / height * maxSize;
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    });
  }
  async function extractImages(enabled) {
    if (!enabled) return [];
    const article = document.querySelector("article") || document.querySelector("main") || document.body;
    const imgs = Array.from(article.querySelectorAll("img"));
    const validImages = imgs.filter(isContentImage).slice(0, 5);
    const results = [];
    for (const img of validImages) {
      try {
        const base64 = await compressAndEncode(img);
        results.push({
          alt: img.alt || img.title || "",
          base64,
          position: results.length
        });
      } catch (e) {
        console.warn("Failed to process image:", e);
      }
    }
    return results;
  }
  content;
  function injectTranslation(element, translation) {
    const wrapper = document.createElement("div");
    wrapper.className = "calcifer-translation-wrapper";
    const shadow = wrapper.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
    .translation {
      color: #9ca3af;
      font-size: 0.9em;
      margin-top: 4px;
      padding-left: 8px;
      border-left: 2px solid #f97316;
      opacity: 0;
      animation: fadeIn 0.3s forwards;
    }
    @keyframes fadeIn {
      to { opacity: 1; }
    }
  `;
    const translationEl = document.createElement("p");
    translationEl.className = "translation";
    translationEl.textContent = translation;
    shadow.appendChild(style);
    shadow.appendChild(translationEl);
    element.insertAdjacentElement("afterend", wrapper);
    return translationEl;
  }
  content;
  function createSelectionToolbar() {
    let toolbar = null;
    document.addEventListener("mouseup", () => {
      const selection = window.getSelection();
      const text = selection == null ? void 0 : selection.toString().trim();
      if (toolbar) {
        toolbar.remove();
        toolbar = null;
      }
      if (!text || text.length < 3) return;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      toolbar = document.createElement("div");
      toolbar.className = "calcifer-selection-toolbar";
      const shadow = toolbar.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `
      .toolbar {
        position: fixed;
        top: ${rect.top - 45}px;
        left: ${rect.left}px;
        background: #1f2937;
        border: 1px solid #374151;
        border-radius: 6px;
        padding: 4px;
        display: flex;
        gap: 4px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        z-index: 999999;
      }
      button {
        padding: 6px 12px;
        background: #374151;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      }
      button:hover {
        background: #4b5563;
      }
    `;
      const container = document.createElement("div");
      container.className = "toolbar";
      const buttons = [
        { text: "Ask AI", action: () => openSidePanelWithText(text, "ask") },
        { text: "Translate", action: () => openSidePanelWithText(text, "translate") },
        { text: "Explain", action: () => openSidePanelWithText(text, "explain") }
      ];
      buttons.forEach(({ text: btnText, action }) => {
        const btn = document.createElement("button");
        btn.textContent = btnText;
        btn.onclick = action;
        container.appendChild(btn);
      });
      shadow.appendChild(style);
      shadow.appendChild(container);
      document.body.appendChild(toolbar);
    });
    document.addEventListener("mousedown", (e) => {
      if (toolbar && !toolbar.contains(e.target)) {
        toolbar.remove();
        toolbar = null;
      }
    });
  }
  function openSidePanelWithText(text, action) {
    chrome.runtime.sendMessage({
      type: "OPEN_SIDEPANEL_WITH_TEXT",
      text,
      action
    });
  }
  content;
  const definition = defineContentScript({
    matches: ["<all_urls>"],
    main() {
      console.log("Calcifer content script loaded");
      chrome.storage.local.get("featureFlags", (result2) => {
        var _a2;
        if ((_a2 = result2.featureFlags) == null ? void 0 : _a2.selectionToolbar) {
          createSelectionToolbar();
        }
      });
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "EXTRACT_PAGE") {
          (async () => {
            const pageContext = await extractPageContent();
            const images = await extractImages(message.imageMode || false);
            sendResponse({ ...pageContext, images });
          })();
          return true;
        }
        if (message.type === "TRANSLATE_PAGE") {
          (async () => {
            var _a2;
            const article = document.querySelector("article") || document.querySelector("main") || document.body;
            const elements = article.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li");
            for (const el of Array.from(elements)) {
              const text = (_a2 = el.textContent) == null ? void 0 : _a2.trim();
              if (!text || text.length < 10) continue;
              const port = chrome.runtime.connect({ name: "translate-stream" });
              let translation = "";
              let translationEl = null;
              port.postMessage({
                type: "TRANSLATE",
                text,
                targetLang: message.targetLang
              });
              port.onMessage.addListener((msg) => {
                if (msg.type === "CHUNK") {
                  translation += msg.chunk;
                  if (!translationEl) {
                    translationEl = injectTranslation(el, translation);
                  } else {
                    translationEl.textContent = translation;
                  }
                } else if (msg.type === "DONE") {
                  port.disconnect();
                }
              });
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            sendResponse({ success: true });
          })();
          return true;
        }
      });
    }
  });
  content;
  const browser = (
    // @ts-expect-error
    ((_b = (_a = globalThis.browser) == null ? void 0 : _a.runtime) == null ? void 0 : _b.id) == null ? globalThis.chrome : (
      // @ts-expect-error
      globalThis.browser
    )
  );
  function print$1(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger$1 = {
    debug: (...args) => print$1(console.debug, ...args),
    log: (...args) => print$1(console.log, ...args),
    warn: (...args) => print$1(console.warn, ...args),
    error: (...args) => print$1(console.error, ...args)
  };
  const _WxtLocationChangeEvent = class _WxtLocationChangeEvent extends Event {
    constructor(newUrl, oldUrl) {
      super(_WxtLocationChangeEvent.EVENT_NAME, {});
      this.newUrl = newUrl;
      this.oldUrl = oldUrl;
    }
  };
  __publicField(_WxtLocationChangeEvent, "EVENT_NAME", getUniqueEventName("wxt:locationchange"));
  let WxtLocationChangeEvent = _WxtLocationChangeEvent;
  function getUniqueEventName(eventName) {
    var _a2;
    return `${(_a2 = browser == null ? void 0 : browser.runtime) == null ? void 0 : _a2.id}:${"content"}:${eventName}`;
  }
  function createLocationWatcher(ctx) {
    let interval;
    let oldUrl;
    return {
      /**
       * Ensure the location watcher is actively looking for URL changes. If it's already watching,
       * this is a noop.
       */
      run() {
        if (interval != null) return;
        oldUrl = new URL(location.href);
        interval = ctx.setInterval(() => {
          let newUrl = new URL(location.href);
          if (newUrl.href !== oldUrl.href) {
            window.dispatchEvent(new WxtLocationChangeEvent(newUrl, oldUrl));
            oldUrl = newUrl;
          }
        }, 1e3);
      }
    };
  }
  const _ContentScriptContext = class _ContentScriptContext {
    constructor(contentScriptName, options) {
      __publicField(this, "isTopFrame", window.self === window.top);
      __publicField(this, "abortController");
      __publicField(this, "locationWatcher", createLocationWatcher(this));
      __publicField(this, "receivedMessageIds", /* @__PURE__ */ new Set());
      this.contentScriptName = contentScriptName;
      this.options = options;
      this.abortController = new AbortController();
      if (this.isTopFrame) {
        this.listenForNewerScripts({ ignoreFirstEvent: true });
        this.stopOldScripts();
      } else {
        this.listenForNewerScripts();
      }
    }
    get signal() {
      return this.abortController.signal;
    }
    abort(reason) {
      return this.abortController.abort(reason);
    }
    get isInvalid() {
      if (browser.runtime.id == null) {
        this.notifyInvalidated();
      }
      return this.signal.aborted;
    }
    get isValid() {
      return !this.isInvalid;
    }
    /**
     * Add a listener that is called when the content script's context is invalidated.
     *
     * @returns A function to remove the listener.
     *
     * @example
     * browser.runtime.onMessage.addListener(cb);
     * const removeInvalidatedListener = ctx.onInvalidated(() => {
     *   browser.runtime.onMessage.removeListener(cb);
     * })
     * // ...
     * removeInvalidatedListener();
     */
    onInvalidated(cb) {
      this.signal.addEventListener("abort", cb);
      return () => this.signal.removeEventListener("abort", cb);
    }
    /**
     * Return a promise that never resolves. Useful if you have an async function that shouldn't run
     * after the context is expired.
     *
     * @example
     * const getValueFromStorage = async () => {
     *   if (ctx.isInvalid) return ctx.block();
     *
     *   // ...
     * }
     */
    block() {
      return new Promise(() => {
      });
    }
    /**
     * Wrapper around `window.setInterval` that automatically clears the interval when invalidated.
     */
    setInterval(handler, timeout) {
      const id = setInterval(() => {
        if (this.isValid) handler();
      }, timeout);
      this.onInvalidated(() => clearInterval(id));
      return id;
    }
    /**
     * Wrapper around `window.setTimeout` that automatically clears the interval when invalidated.
     */
    setTimeout(handler, timeout) {
      const id = setTimeout(() => {
        if (this.isValid) handler();
      }, timeout);
      this.onInvalidated(() => clearTimeout(id));
      return id;
    }
    /**
     * Wrapper around `window.requestAnimationFrame` that automatically cancels the request when
     * invalidated.
     */
    requestAnimationFrame(callback) {
      const id = requestAnimationFrame((...args) => {
        if (this.isValid) callback(...args);
      });
      this.onInvalidated(() => cancelAnimationFrame(id));
      return id;
    }
    /**
     * Wrapper around `window.requestIdleCallback` that automatically cancels the request when
     * invalidated.
     */
    requestIdleCallback(callback, options) {
      const id = requestIdleCallback((...args) => {
        if (!this.signal.aborted) callback(...args);
      }, options);
      this.onInvalidated(() => cancelIdleCallback(id));
      return id;
    }
    addEventListener(target, type, handler, options) {
      var _a2;
      if (type === "wxt:locationchange") {
        if (this.isValid) this.locationWatcher.run();
      }
      (_a2 = target.addEventListener) == null ? void 0 : _a2.call(
        target,
        type.startsWith("wxt:") ? getUniqueEventName(type) : type,
        handler,
        {
          ...options,
          signal: this.signal
        }
      );
    }
    /**
     * @internal
     * Abort the abort controller and execute all `onInvalidated` listeners.
     */
    notifyInvalidated() {
      this.abort("Content script context invalidated");
      logger$1.debug(
        `Content script "${this.contentScriptName}" context invalidated`
      );
    }
    stopOldScripts() {
      window.postMessage(
        {
          type: _ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
          contentScriptName: this.contentScriptName,
          messageId: Math.random().toString(36).slice(2)
        },
        "*"
      );
    }
    verifyScriptStartedEvent(event) {
      var _a2, _b2, _c;
      const isScriptStartedEvent = ((_a2 = event.data) == null ? void 0 : _a2.type) === _ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE;
      const isSameContentScript = ((_b2 = event.data) == null ? void 0 : _b2.contentScriptName) === this.contentScriptName;
      const isNotDuplicate = !this.receivedMessageIds.has((_c = event.data) == null ? void 0 : _c.messageId);
      return isScriptStartedEvent && isSameContentScript && isNotDuplicate;
    }
    listenForNewerScripts(options) {
      let isFirst = true;
      const cb = (event) => {
        if (this.verifyScriptStartedEvent(event)) {
          this.receivedMessageIds.add(event.data.messageId);
          const wasFirst = isFirst;
          isFirst = false;
          if (wasFirst && (options == null ? void 0 : options.ignoreFirstEvent)) return;
          this.notifyInvalidated();
        }
      };
      addEventListener("message", cb);
      this.onInvalidated(() => removeEventListener("message", cb));
    }
  };
  __publicField(_ContentScriptContext, "SCRIPT_STARTED_MESSAGE_TYPE", getUniqueEventName(
    "wxt:content-script-started"
  ));
  let ContentScriptContext = _ContentScriptContext;
  const nullKey = Symbol("null");
  let keyCounter = 0;
  class ManyKeysMap extends Map {
    constructor() {
      super();
      this._objectHashes = /* @__PURE__ */ new WeakMap();
      this._symbolHashes = /* @__PURE__ */ new Map();
      this._publicKeys = /* @__PURE__ */ new Map();
      const [pairs] = arguments;
      if (pairs === null || pairs === void 0) {
        return;
      }
      if (typeof pairs[Symbol.iterator] !== "function") {
        throw new TypeError(typeof pairs + " is not iterable (cannot read property Symbol(Symbol.iterator))");
      }
      for (const [keys, value] of pairs) {
        this.set(keys, value);
      }
    }
    _getPublicKeys(keys, create = false) {
      if (!Array.isArray(keys)) {
        throw new TypeError("The keys parameter must be an array");
      }
      const privateKey = this._getPrivateKey(keys, create);
      let publicKey;
      if (privateKey && this._publicKeys.has(privateKey)) {
        publicKey = this._publicKeys.get(privateKey);
      } else if (create) {
        publicKey = [...keys];
        this._publicKeys.set(privateKey, publicKey);
      }
      return { privateKey, publicKey };
    }
    _getPrivateKey(keys, create = false) {
      const privateKeys = [];
      for (let key of keys) {
        if (key === null) {
          key = nullKey;
        }
        const hashes = typeof key === "object" || typeof key === "function" ? "_objectHashes" : typeof key === "symbol" ? "_symbolHashes" : false;
        if (!hashes) {
          privateKeys.push(key);
        } else if (this[hashes].has(key)) {
          privateKeys.push(this[hashes].get(key));
        } else if (create) {
          const privateKey = `@@mkm-ref-${keyCounter++}@@`;
          this[hashes].set(key, privateKey);
          privateKeys.push(privateKey);
        } else {
          return false;
        }
      }
      return JSON.stringify(privateKeys);
    }
    set(keys, value) {
      const { publicKey } = this._getPublicKeys(keys, true);
      return super.set(publicKey, value);
    }
    get(keys) {
      const { publicKey } = this._getPublicKeys(keys);
      return super.get(publicKey);
    }
    has(keys) {
      const { publicKey } = this._getPublicKeys(keys);
      return super.has(publicKey);
    }
    delete(keys) {
      const { publicKey, privateKey } = this._getPublicKeys(keys);
      return Boolean(publicKey && super.delete(publicKey) && this._publicKeys.delete(privateKey));
    }
    clear() {
      super.clear();
      this._symbolHashes.clear();
      this._publicKeys.clear();
    }
    get [Symbol.toStringTag]() {
      return "ManyKeysMap";
    }
    get size() {
      return super.size;
    }
  }
  new ManyKeysMap();
  function initPlugins() {
  }
  function print(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger = {
    debug: (...args) => print(console.debug, ...args),
    log: (...args) => print(console.log, ...args),
    warn: (...args) => print(console.warn, ...args),
    error: (...args) => print(console.error, ...args)
  };
  const result = (async () => {
    try {
      initPlugins();
      const { main, ...options } = definition;
      const ctx = new ContentScriptContext("content", options);
      return await main(ctx);
    } catch (err) {
      logger.error(
        `The content script "${"content"}" crashed on startup!`,
        err
      );
      throw err;
    }
  })();
  return result;
})();
content;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3NhbmRib3gvZGVmaW5lLWNvbnRlbnQtc2NyaXB0Lm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AbW96aWxsYS9yZWFkYWJpbGl0eS9SZWFkYWJpbGl0eS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AbW96aWxsYS9yZWFkYWJpbGl0eS9SZWFkYWJpbGl0eS1yZWFkZXJhYmxlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0Btb3ppbGxhL3JlYWRhYmlsaXR5L2luZGV4LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3R1cm5kb3duL2xpYi90dXJuZG93bi5icm93c2VyLmVzLmpzIiwiLi4vLi4vLi4vc3JjL2VudHJ5cG9pbnRzL2NvbnRlbnQvZXh0cmFjdG9yL3RleHQudHMiLCIuLi8uLi8uLi9zcmMvZW50cnlwb2ludHMvY29udGVudC9leHRyYWN0b3IvaW1hZ2UudHMiLCIuLi8uLi8uLi9zcmMvZW50cnlwb2ludHMvY29udGVudC90cmFuc2xhdG9yL3JlbmRlcmVyLnRzIiwiLi4vLi4vLi4vc3JjL2VudHJ5cG9pbnRzL2NvbnRlbnQvc2VsZWN0aW9uL3Rvb2xiYXIudHMiLCIuLi8uLi8uLi9zcmMvZW50cnlwb2ludHMvY29udGVudC9pbmRleC50cyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC9icm93c2VyL2Nocm9tZS5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3Qvc2FuZGJveC91dGlscy9sb2dnZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L2NsaWVudC9jb250ZW50LXNjcmlwdHMvY3VzdG9tLWV2ZW50cy5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvY2xpZW50L2NvbnRlbnQtc2NyaXB0cy9sb2NhdGlvbi13YXRjaGVyLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC9jbGllbnQvY29udGVudC1zY3JpcHRzL2NvbnRlbnQtc2NyaXB0LWNvbnRleHQubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL21hbnkta2V5cy1tYXAvaW5kZXguanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQDFuYXRzdS93YWl0LWVsZW1lbnQvZGlzdC9pbmRleC5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUNvbnRlbnRTY3JpcHQoZGVmaW5pdGlvbikge1xuICByZXR1cm4gZGVmaW5pdGlvbjtcbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAgQXJjOTAgSW5jXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qXG4gKiBUaGlzIGNvZGUgaXMgaGVhdmlseSBiYXNlZCBvbiBBcmM5MCdzIHJlYWRhYmlsaXR5LmpzICgxLjcuMSkgc2NyaXB0XG4gKiBhdmFpbGFibGUgYXQ6IGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9hcmM5MGxhYnMtcmVhZGFiaWxpdHlcbiAqL1xuXG4vKipcbiAqIFB1YmxpYyBjb25zdHJ1Y3Rvci5cbiAqIEBwYXJhbSB7SFRNTERvY3VtZW50fSBkb2MgICAgIFRoZSBkb2N1bWVudCB0byBwYXJzZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICBvcHRpb25zIFRoZSBvcHRpb25zIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gUmVhZGFiaWxpdHkoZG9jLCBvcHRpb25zKSB7XG4gIC8vIEluIHNvbWUgb2xkZXIgdmVyc2lvbnMsIHBlb3BsZSBwYXNzZWQgYSBVUkkgYXMgdGhlIGZpcnN0IGFyZ3VtZW50LiBDb3BlOlxuICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmRvY3VtZW50RWxlbWVudCkge1xuICAgIGRvYyA9IG9wdGlvbnM7XG4gICAgb3B0aW9ucyA9IGFyZ3VtZW50c1syXTtcbiAgfSBlbHNlIGlmICghZG9jIHx8ICFkb2MuZG9jdW1lbnRFbGVtZW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgYXJndW1lbnQgdG8gUmVhZGFiaWxpdHkgY29uc3RydWN0b3Igc2hvdWxkIGJlIGEgZG9jdW1lbnQgb2JqZWN0LlwiKTtcbiAgfVxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB0aGlzLl9kb2MgPSBkb2M7XG4gIHRoaXMuX2RvY0pTRE9NUGFyc2VyID0gdGhpcy5fZG9jLmZpcnN0Q2hpbGQuX19KU0RPTVBhcnNlcl9fO1xuICB0aGlzLl9hcnRpY2xlVGl0bGUgPSBudWxsO1xuICB0aGlzLl9hcnRpY2xlQnlsaW5lID0gbnVsbDtcbiAgdGhpcy5fYXJ0aWNsZURpciA9IG51bGw7XG4gIHRoaXMuX2FydGljbGVTaXRlTmFtZSA9IG51bGw7XG4gIHRoaXMuX2F0dGVtcHRzID0gW107XG5cbiAgLy8gQ29uZmlndXJhYmxlIG9wdGlvbnNcbiAgdGhpcy5fZGVidWcgPSAhIW9wdGlvbnMuZGVidWc7XG4gIHRoaXMuX21heEVsZW1zVG9QYXJzZSA9IG9wdGlvbnMubWF4RWxlbXNUb1BhcnNlIHx8IHRoaXMuREVGQVVMVF9NQVhfRUxFTVNfVE9fUEFSU0U7XG4gIHRoaXMuX25iVG9wQ2FuZGlkYXRlcyA9IG9wdGlvbnMubmJUb3BDYW5kaWRhdGVzIHx8IHRoaXMuREVGQVVMVF9OX1RPUF9DQU5ESURBVEVTO1xuICB0aGlzLl9jaGFyVGhyZXNob2xkID0gb3B0aW9ucy5jaGFyVGhyZXNob2xkIHx8IHRoaXMuREVGQVVMVF9DSEFSX1RIUkVTSE9MRDtcbiAgdGhpcy5fY2xhc3Nlc1RvUHJlc2VydmUgPSB0aGlzLkNMQVNTRVNfVE9fUFJFU0VSVkUuY29uY2F0KG9wdGlvbnMuY2xhc3Nlc1RvUHJlc2VydmUgfHwgW10pO1xuICB0aGlzLl9rZWVwQ2xhc3NlcyA9ICEhb3B0aW9ucy5rZWVwQ2xhc3NlcztcbiAgdGhpcy5fc2VyaWFsaXplciA9IG9wdGlvbnMuc2VyaWFsaXplciB8fCBmdW5jdGlvbihlbCkge1xuICAgIHJldHVybiBlbC5pbm5lckhUTUw7XG4gIH07XG4gIHRoaXMuX2Rpc2FibGVKU09OTEQgPSAhIW9wdGlvbnMuZGlzYWJsZUpTT05MRDtcbiAgdGhpcy5fYWxsb3dlZFZpZGVvUmVnZXggPSBvcHRpb25zLmFsbG93ZWRWaWRlb1JlZ2V4IHx8IHRoaXMuUkVHRVhQUy52aWRlb3M7XG5cbiAgLy8gU3RhcnQgd2l0aCBhbGwgZmxhZ3Mgc2V0XG4gIHRoaXMuX2ZsYWdzID0gdGhpcy5GTEFHX1NUUklQX1VOTElLRUxZUyB8XG4gICAgICAgICAgICAgICAgdGhpcy5GTEFHX1dFSUdIVF9DTEFTU0VTIHxcbiAgICAgICAgICAgICAgICB0aGlzLkZMQUdfQ0xFQU5fQ09ORElUSU9OQUxMWTtcblxuXG4gIC8vIENvbnRyb2wgd2hldGhlciBsb2cgbWVzc2FnZXMgYXJlIHNlbnQgdG8gdGhlIGNvbnNvbGVcbiAgaWYgKHRoaXMuX2RlYnVnKSB7XG4gICAgbGV0IGxvZ05vZGUgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PSBub2RlLlRFWFRfTk9ERSkge1xuICAgICAgICByZXR1cm4gYCR7bm9kZS5ub2RlTmFtZX0gKFwiJHtub2RlLnRleHRDb250ZW50fVwiKWA7XG4gICAgICB9XG4gICAgICBsZXQgYXR0clBhaXJzID0gQXJyYXkuZnJvbShub2RlLmF0dHJpYnV0ZXMgfHwgW10sIGZ1bmN0aW9uKGF0dHIpIHtcbiAgICAgICAgcmV0dXJuIGAke2F0dHIubmFtZX09XCIke2F0dHIudmFsdWV9XCJgO1xuICAgICAgfSkuam9pbihcIiBcIik7XG4gICAgICByZXR1cm4gYDwke25vZGUubG9jYWxOYW1lfSAke2F0dHJQYWlyc30+YDtcbiAgICB9O1xuICAgIHRoaXMubG9nID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMsIGFyZyA9PiB7XG4gICAgICAgICAgaWYgKGFyZyAmJiBhcmcubm9kZVR5cGUgPT0gdGhpcy5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICAgIHJldHVybiBsb2dOb2RlKGFyZyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBhcmc7XG4gICAgICAgIH0pO1xuICAgICAgICBhcmdzLnVuc2hpZnQoXCJSZWFkZXI6IChSZWFkYWJpbGl0eSlcIik7XG4gICAgICAgIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZHVtcCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvKiBnbG9iYWwgZHVtcCAqL1xuICAgICAgICB2YXIgbXNnID0gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKGFyZ3VtZW50cywgZnVuY3Rpb24oeCkge1xuICAgICAgICAgIHJldHVybiAoeCAmJiB4Lm5vZGVOYW1lKSA/IGxvZ05vZGUoeCkgOiB4O1xuICAgICAgICB9KS5qb2luKFwiIFwiKTtcbiAgICAgICAgZHVtcChcIlJlYWRlcjogKFJlYWRhYmlsaXR5KSBcIiArIG1zZyArIFwiXFxuXCIpO1xuICAgICAgfVxuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5sb2cgPSBmdW5jdGlvbiAoKSB7fTtcbiAgfVxufVxuXG5SZWFkYWJpbGl0eS5wcm90b3R5cGUgPSB7XG4gIEZMQUdfU1RSSVBfVU5MSUtFTFlTOiAweDEsXG4gIEZMQUdfV0VJR0hUX0NMQVNTRVM6IDB4MixcbiAgRkxBR19DTEVBTl9DT05ESVRJT05BTExZOiAweDQsXG5cbiAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL05vZGUvbm9kZVR5cGVcbiAgRUxFTUVOVF9OT0RFOiAxLFxuICBURVhUX05PREU6IDMsXG5cbiAgLy8gTWF4IG51bWJlciBvZiBub2RlcyBzdXBwb3J0ZWQgYnkgdGhpcyBwYXJzZXIuIERlZmF1bHQ6IDAgKG5vIGxpbWl0KVxuICBERUZBVUxUX01BWF9FTEVNU19UT19QQVJTRTogMCxcblxuICAvLyBUaGUgbnVtYmVyIG9mIHRvcCBjYW5kaWRhdGVzIHRvIGNvbnNpZGVyIHdoZW4gYW5hbHlzaW5nIGhvd1xuICAvLyB0aWdodCB0aGUgY29tcGV0aXRpb24gaXMgYW1vbmcgY2FuZGlkYXRlcy5cbiAgREVGQVVMVF9OX1RPUF9DQU5ESURBVEVTOiA1LFxuXG4gIC8vIEVsZW1lbnQgdGFncyB0byBzY29yZSBieSBkZWZhdWx0LlxuICBERUZBVUxUX1RBR1NfVE9fU0NPUkU6IFwic2VjdGlvbixoMixoMyxoNCxoNSxoNixwLHRkLHByZVwiLnRvVXBwZXJDYXNlKCkuc3BsaXQoXCIsXCIpLFxuXG4gIC8vIFRoZSBkZWZhdWx0IG51bWJlciBvZiBjaGFycyBhbiBhcnRpY2xlIG11c3QgaGF2ZSBpbiBvcmRlciB0byByZXR1cm4gYSByZXN1bHRcbiAgREVGQVVMVF9DSEFSX1RIUkVTSE9MRDogNTAwLFxuXG4gIC8vIEFsbCBvZiB0aGUgcmVndWxhciBleHByZXNzaW9ucyBpbiB1c2Ugd2l0aGluIHJlYWRhYmlsaXR5LlxuICAvLyBEZWZpbmVkIHVwIGhlcmUgc28gd2UgZG9uJ3QgaW5zdGFudGlhdGUgdGhlbSByZXBlYXRlZGx5IGluIGxvb3BzLlxuICBSRUdFWFBTOiB7XG4gICAgLy8gTk9URTogVGhlc2UgdHdvIHJlZ3VsYXIgZXhwcmVzc2lvbnMgYXJlIGR1cGxpY2F0ZWQgaW5cbiAgICAvLyBSZWFkYWJpbGl0eS1yZWFkZXJhYmxlLmpzLiBQbGVhc2Uga2VlcCBib3RoIGNvcGllcyBpbiBzeW5jLlxuICAgIHVubGlrZWx5Q2FuZGlkYXRlczogLy1hZC18YWkyaHRtbHxiYW5uZXJ8YnJlYWRjcnVtYnN8Y29tYnh8Y29tbWVudHxjb21tdW5pdHl8Y292ZXItd3JhcHxkaXNxdXN8ZXh0cmF8Zm9vdGVyfGdkcHJ8aGVhZGVyfGxlZ2VuZHN8bWVudXxyZWxhdGVkfHJlbWFya3xyZXBsaWVzfHJzc3xzaG91dGJveHxzaWRlYmFyfHNreXNjcmFwZXJ8c29jaWFsfHNwb25zb3J8c3VwcGxlbWVudGFsfGFkLWJyZWFrfGFnZWdhdGV8cGFnaW5hdGlvbnxwYWdlcnxwb3B1cHx5b20tcmVtb3RlL2ksXG4gICAgb2tNYXliZUl0c0FDYW5kaWRhdGU6IC9hbmR8YXJ0aWNsZXxib2R5fGNvbHVtbnxjb250ZW50fG1haW58c2hhZG93L2ksXG5cbiAgICBwb3NpdGl2ZTogL2FydGljbGV8Ym9keXxjb250ZW50fGVudHJ5fGhlbnRyeXxoLWVudHJ5fG1haW58cGFnZXxwYWdpbmF0aW9ufHBvc3R8dGV4dHxibG9nfHN0b3J5L2ksXG4gICAgbmVnYXRpdmU6IC8tYWQtfGhpZGRlbnxeaGlkJHwgaGlkJHwgaGlkIHxeaGlkIHxiYW5uZXJ8Y29tYnh8Y29tbWVudHxjb20tfGNvbnRhY3R8Zm9vdHxmb290ZXJ8Zm9vdG5vdGV8Z2RwcnxtYXN0aGVhZHxtZWRpYXxtZXRhfG91dGJyYWlufHByb21vfHJlbGF0ZWR8c2Nyb2xsfHNoYXJlfHNob3V0Ym94fHNpZGViYXJ8c2t5c2NyYXBlcnxzcG9uc29yfHNob3BwaW5nfHRhZ3N8dG9vbHx3aWRnZXQvaSxcbiAgICBleHRyYW5lb3VzOiAvcHJpbnR8YXJjaGl2ZXxjb21tZW50fGRpc2N1c3N8ZVtcXC1dP21haWx8c2hhcmV8cmVwbHl8YWxsfGxvZ2lufHNpZ258c2luZ2xlfHV0aWxpdHkvaSxcbiAgICBieWxpbmU6IC9ieWxpbmV8YXV0aG9yfGRhdGVsaW5lfHdyaXR0ZW5ieXxwLWF1dGhvci9pLFxuICAgIHJlcGxhY2VGb250czogLzwoXFwvPylmb250W14+XSo+L2dpLFxuICAgIG5vcm1hbGl6ZTogL1xcc3syLH0vZyxcbiAgICB2aWRlb3M6IC9cXC9cXC8od3d3XFwuKT8oKGRhaWx5bW90aW9ufHlvdXR1YmV8eW91dHViZS1ub2Nvb2tpZXxwbGF5ZXJcXC52aW1lb3x2XFwucXEpXFwuY29tfChhcmNoaXZlfHVwbG9hZFxcLndpa2ltZWRpYSlcXC5vcmd8cGxheWVyXFwudHdpdGNoXFwudHYpL2ksXG4gICAgc2hhcmVFbGVtZW50czogLyhcXGJ8Xykoc2hhcmV8c2hhcmVkYWRkeSkoXFxifF8pL2ksXG4gICAgbmV4dExpbms6IC8obmV4dHx3ZWl0ZXJ8Y29udGludWV8PihbXlxcfF18JCl8wrsoW15cXHxdfCQpKS9pLFxuICAgIHByZXZMaW5rOiAvKHByZXZ8ZWFybHxvbGR8bmV3fDx8wqspL2ksXG4gICAgdG9rZW5pemU6IC9cXFcrL2csXG4gICAgd2hpdGVzcGFjZTogL15cXHMqJC8sXG4gICAgaGFzQ29udGVudDogL1xcUyQvLFxuICAgIGhhc2hVcmw6IC9eIy4rLyxcbiAgICBzcmNzZXRVcmw6IC8oXFxTKykoXFxzK1tcXGQuXStbeHddKT8oXFxzKig/Oix8JCkpL2csXG4gICAgYjY0RGF0YVVybDogL15kYXRhOlxccyooW15cXHM7LF0rKVxccyo7XFxzKmJhc2U2NFxccyosL2ksXG4gICAgLy8gQ29tbWFzIGFzIHVzZWQgaW4gTGF0aW4sIFNpbmRoaSwgQ2hpbmVzZSBhbmQgdmFyaW91cyBvdGhlciBzY3JpcHRzLlxuICAgIC8vIHNlZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQ29tbWEjQ29tbWFfdmFyaWFudHNcbiAgICBjb21tYXM6IC9cXHUwMDJDfFxcdTA2MEN8XFx1RkU1MHxcXHVGRTEwfFxcdUZFMTF8XFx1MkU0MXxcXHUyRTM0fFxcdTJFMzJ8XFx1RkYwQy9nLFxuICAgIC8vIFNlZTogaHR0cHM6Ly9zY2hlbWEub3JnL0FydGljbGVcbiAgICBqc29uTGRBcnRpY2xlVHlwZXM6IC9eQXJ0aWNsZXxBZHZlcnRpc2VyQ29udGVudEFydGljbGV8TmV3c0FydGljbGV8QW5hbHlzaXNOZXdzQXJ0aWNsZXxBc2tQdWJsaWNOZXdzQXJ0aWNsZXxCYWNrZ3JvdW5kTmV3c0FydGljbGV8T3Bpbmlvbk5ld3NBcnRpY2xlfFJlcG9ydGFnZU5ld3NBcnRpY2xlfFJldmlld05ld3NBcnRpY2xlfFJlcG9ydHxTYXRpcmljYWxBcnRpY2xlfFNjaG9sYXJseUFydGljbGV8TWVkaWNhbFNjaG9sYXJseUFydGljbGV8U29jaWFsTWVkaWFQb3N0aW5nfEJsb2dQb3N0aW5nfExpdmVCbG9nUG9zdGluZ3xEaXNjdXNzaW9uRm9ydW1Qb3N0aW5nfFRlY2hBcnRpY2xlfEFQSVJlZmVyZW5jZSQvXG4gIH0sXG5cbiAgVU5MSUtFTFlfUk9MRVM6IFsgXCJtZW51XCIsIFwibWVudWJhclwiLCBcImNvbXBsZW1lbnRhcnlcIiwgXCJuYXZpZ2F0aW9uXCIsIFwiYWxlcnRcIiwgXCJhbGVydGRpYWxvZ1wiLCBcImRpYWxvZ1wiIF0sXG5cbiAgRElWX1RPX1BfRUxFTVM6IG5ldyBTZXQoWyBcIkJMT0NLUVVPVEVcIiwgXCJETFwiLCBcIkRJVlwiLCBcIklNR1wiLCBcIk9MXCIsIFwiUFwiLCBcIlBSRVwiLCBcIlRBQkxFXCIsIFwiVUxcIiBdKSxcblxuICBBTFRFUl9UT19ESVZfRVhDRVBUSU9OUzogW1wiRElWXCIsIFwiQVJUSUNMRVwiLCBcIlNFQ1RJT05cIiwgXCJQXCJdLFxuXG4gIFBSRVNFTlRBVElPTkFMX0FUVFJJQlVURVM6IFsgXCJhbGlnblwiLCBcImJhY2tncm91bmRcIiwgXCJiZ2NvbG9yXCIsIFwiYm9yZGVyXCIsIFwiY2VsbHBhZGRpbmdcIiwgXCJjZWxsc3BhY2luZ1wiLCBcImZyYW1lXCIsIFwiaHNwYWNlXCIsIFwicnVsZXNcIiwgXCJzdHlsZVwiLCBcInZhbGlnblwiLCBcInZzcGFjZVwiIF0sXG5cbiAgREVQUkVDQVRFRF9TSVpFX0FUVFJJQlVURV9FTEVNUzogWyBcIlRBQkxFXCIsIFwiVEhcIiwgXCJURFwiLCBcIkhSXCIsIFwiUFJFXCIgXSxcblxuICAvLyBUaGUgY29tbWVudGVkIG91dCBlbGVtZW50cyBxdWFsaWZ5IGFzIHBocmFzaW5nIGNvbnRlbnQgYnV0IHRlbmQgdG8gYmVcbiAgLy8gcmVtb3ZlZCBieSByZWFkYWJpbGl0eSB3aGVuIHB1dCBpbnRvIHBhcmFncmFwaHMsIHNvIHdlIGlnbm9yZSB0aGVtIGhlcmUuXG4gIFBIUkFTSU5HX0VMRU1TOiBbXG4gICAgLy8gXCJDQU5WQVNcIiwgXCJJRlJBTUVcIiwgXCJTVkdcIiwgXCJWSURFT1wiLFxuICAgIFwiQUJCUlwiLCBcIkFVRElPXCIsIFwiQlwiLCBcIkJET1wiLCBcIkJSXCIsIFwiQlVUVE9OXCIsIFwiQ0lURVwiLCBcIkNPREVcIiwgXCJEQVRBXCIsXG4gICAgXCJEQVRBTElTVFwiLCBcIkRGTlwiLCBcIkVNXCIsIFwiRU1CRURcIiwgXCJJXCIsIFwiSU1HXCIsIFwiSU5QVVRcIiwgXCJLQkRcIiwgXCJMQUJFTFwiLFxuICAgIFwiTUFSS1wiLCBcIk1BVEhcIiwgXCJNRVRFUlwiLCBcIk5PU0NSSVBUXCIsIFwiT0JKRUNUXCIsIFwiT1VUUFVUXCIsIFwiUFJPR1JFU1NcIiwgXCJRXCIsXG4gICAgXCJSVUJZXCIsIFwiU0FNUFwiLCBcIlNDUklQVFwiLCBcIlNFTEVDVFwiLCBcIlNNQUxMXCIsIFwiU1BBTlwiLCBcIlNUUk9OR1wiLCBcIlNVQlwiLFxuICAgIFwiU1VQXCIsIFwiVEVYVEFSRUFcIiwgXCJUSU1FXCIsIFwiVkFSXCIsIFwiV0JSXCJcbiAgXSxcblxuICAvLyBUaGVzZSBhcmUgdGhlIGNsYXNzZXMgdGhhdCByZWFkYWJpbGl0eSBzZXRzIGl0c2VsZi5cbiAgQ0xBU1NFU19UT19QUkVTRVJWRTogWyBcInBhZ2VcIiBdLFxuXG4gIC8vIFRoZXNlIGFyZSB0aGUgbGlzdCBvZiBIVE1MIGVudGl0aWVzIHRoYXQgbmVlZCB0byBiZSBlc2NhcGVkLlxuICBIVE1MX0VTQ0FQRV9NQVA6IHtcbiAgICBcImx0XCI6IFwiPFwiLFxuICAgIFwiZ3RcIjogXCI+XCIsXG4gICAgXCJhbXBcIjogXCImXCIsXG4gICAgXCJxdW90XCI6ICdcIicsXG4gICAgXCJhcG9zXCI6IFwiJ1wiLFxuICB9LFxuXG4gIC8qKlxuICAgKiBSdW4gYW55IHBvc3QtcHJvY2VzcyBtb2RpZmljYXRpb25zIHRvIGFydGljbGUgY29udGVudCBhcyBuZWNlc3NhcnkuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEByZXR1cm4gdm9pZFxuICAqKi9cbiAgX3Bvc3RQcm9jZXNzQ29udGVudDogZnVuY3Rpb24oYXJ0aWNsZUNvbnRlbnQpIHtcbiAgICAvLyBSZWFkYWJpbGl0eSBjYW5ub3Qgb3BlbiByZWxhdGl2ZSB1cmlzIHNvIHdlIGNvbnZlcnQgdGhlbSB0byBhYnNvbHV0ZSB1cmlzLlxuICAgIHRoaXMuX2ZpeFJlbGF0aXZlVXJpcyhhcnRpY2xlQ29udGVudCk7XG5cbiAgICB0aGlzLl9zaW1wbGlmeU5lc3RlZEVsZW1lbnRzKGFydGljbGVDb250ZW50KTtcblxuICAgIGlmICghdGhpcy5fa2VlcENsYXNzZXMpIHtcbiAgICAgIC8vIFJlbW92ZSBjbGFzc2VzLlxuICAgICAgdGhpcy5fY2xlYW5DbGFzc2VzKGFydGljbGVDb250ZW50KTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEl0ZXJhdGVzIG92ZXIgYSBOb2RlTGlzdCwgY2FsbHMgYGZpbHRlckZuYCBmb3IgZWFjaCBub2RlIGFuZCByZW1vdmVzIG5vZGVcbiAgICogaWYgZnVuY3Rpb24gcmV0dXJuZWQgYHRydWVgLlxuICAgKlxuICAgKiBJZiBmdW5jdGlvbiBpcyBub3QgcGFzc2VkLCByZW1vdmVzIGFsbCB0aGUgbm9kZXMgaW4gbm9kZSBsaXN0LlxuICAgKlxuICAgKiBAcGFyYW0gTm9kZUxpc3Qgbm9kZUxpc3QgVGhlIG5vZGVzIHRvIG9wZXJhdGUgb25cbiAgICogQHBhcmFtIEZ1bmN0aW9uIGZpbHRlckZuIHRoZSBmdW5jdGlvbiB0byB1c2UgYXMgYSBmaWx0ZXJcbiAgICogQHJldHVybiB2b2lkXG4gICAqL1xuICBfcmVtb3ZlTm9kZXM6IGZ1bmN0aW9uKG5vZGVMaXN0LCBmaWx0ZXJGbikge1xuICAgIC8vIEF2b2lkIGV2ZXIgb3BlcmF0aW5nIG9uIGxpdmUgbm9kZSBsaXN0cy5cbiAgICBpZiAodGhpcy5fZG9jSlNET01QYXJzZXIgJiYgbm9kZUxpc3QuX2lzTGl2ZU5vZGVMaXN0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEbyBub3QgcGFzcyBsaXZlIG5vZGUgbGlzdHMgdG8gX3JlbW92ZU5vZGVzXCIpO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gbm9kZUxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHZhciBub2RlID0gbm9kZUxpc3RbaV07XG4gICAgICB2YXIgcGFyZW50Tm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgIGlmICghZmlsdGVyRm4gfHwgZmlsdGVyRm4uY2FsbCh0aGlzLCBub2RlLCBpLCBub2RlTGlzdCkpIHtcbiAgICAgICAgICBwYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBJdGVyYXRlcyBvdmVyIGEgTm9kZUxpc3QsIGFuZCBjYWxscyBfc2V0Tm9kZVRhZyBmb3IgZWFjaCBub2RlLlxuICAgKlxuICAgKiBAcGFyYW0gTm9kZUxpc3Qgbm9kZUxpc3QgVGhlIG5vZGVzIHRvIG9wZXJhdGUgb25cbiAgICogQHBhcmFtIFN0cmluZyBuZXdUYWdOYW1lIHRoZSBuZXcgdGFnIG5hbWUgdG8gdXNlXG4gICAqIEByZXR1cm4gdm9pZFxuICAgKi9cbiAgX3JlcGxhY2VOb2RlVGFnczogZnVuY3Rpb24obm9kZUxpc3QsIG5ld1RhZ05hbWUpIHtcbiAgICAvLyBBdm9pZCBldmVyIG9wZXJhdGluZyBvbiBsaXZlIG5vZGUgbGlzdHMuXG4gICAgaWYgKHRoaXMuX2RvY0pTRE9NUGFyc2VyICYmIG5vZGVMaXN0Ll9pc0xpdmVOb2RlTGlzdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRG8gbm90IHBhc3MgbGl2ZSBub2RlIGxpc3RzIHRvIF9yZXBsYWNlTm9kZVRhZ3NcIik7XG4gICAgfVxuICAgIGZvciAoY29uc3Qgbm9kZSBvZiBub2RlTGlzdCkge1xuICAgICAgdGhpcy5fc2V0Tm9kZVRhZyhub2RlLCBuZXdUYWdOYW1lKTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBhIE5vZGVMaXN0LCB3aGljaCBkb2Vzbid0IG5hdGl2ZWx5IGZ1bGx5IGltcGxlbWVudCB0aGUgQXJyYXlcbiAgICogaW50ZXJmYWNlLlxuICAgKlxuICAgKiBGb3IgY29udmVuaWVuY2UsIHRoZSBjdXJyZW50IG9iamVjdCBjb250ZXh0IGlzIGFwcGxpZWQgdG8gdGhlIHByb3ZpZGVkXG4gICAqIGl0ZXJhdGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSAgTm9kZUxpc3Qgbm9kZUxpc3QgVGhlIE5vZGVMaXN0LlxuICAgKiBAcGFyYW0gIEZ1bmN0aW9uIGZuICAgICAgIFRoZSBpdGVyYXRlIGZ1bmN0aW9uLlxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICovXG4gIF9mb3JFYWNoTm9kZTogZnVuY3Rpb24obm9kZUxpc3QsIGZuKSB7XG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChub2RlTGlzdCwgZm4sIHRoaXMpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgYSBOb2RlTGlzdCwgYW5kIHJldHVybiB0aGUgZmlyc3Qgbm9kZSB0aGF0IHBhc3Nlc1xuICAgKiB0aGUgc3VwcGxpZWQgdGVzdCBmdW5jdGlvblxuICAgKlxuICAgKiBGb3IgY29udmVuaWVuY2UsIHRoZSBjdXJyZW50IG9iamVjdCBjb250ZXh0IGlzIGFwcGxpZWQgdG8gdGhlIHByb3ZpZGVkXG4gICAqIHRlc3QgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSAgTm9kZUxpc3Qgbm9kZUxpc3QgVGhlIE5vZGVMaXN0LlxuICAgKiBAcGFyYW0gIEZ1bmN0aW9uIGZuICAgICAgIFRoZSB0ZXN0IGZ1bmN0aW9uLlxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICovXG4gIF9maW5kTm9kZTogZnVuY3Rpb24obm9kZUxpc3QsIGZuKSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5maW5kLmNhbGwobm9kZUxpc3QsIGZuLCB0aGlzKTtcbiAgfSxcblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGEgTm9kZUxpc3QsIHJldHVybiB0cnVlIGlmIGFueSBvZiB0aGUgcHJvdmlkZWQgaXRlcmF0ZVxuICAgKiBmdW5jdGlvbiBjYWxscyByZXR1cm5zIHRydWUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICpcbiAgICogRm9yIGNvbnZlbmllbmNlLCB0aGUgY3VycmVudCBvYmplY3QgY29udGV4dCBpcyBhcHBsaWVkIHRvIHRoZVxuICAgKiBwcm92aWRlZCBpdGVyYXRlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gIE5vZGVMaXN0IG5vZGVMaXN0IFRoZSBOb2RlTGlzdC5cbiAgICogQHBhcmFtICBGdW5jdGlvbiBmbiAgICAgICBUaGUgaXRlcmF0ZSBmdW5jdGlvbi5cbiAgICogQHJldHVybiBCb29sZWFuXG4gICAqL1xuICBfc29tZU5vZGU6IGZ1bmN0aW9uKG5vZGVMaXN0LCBmbikge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc29tZS5jYWxsKG5vZGVMaXN0LCBmbiwgdGhpcyk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBhIE5vZGVMaXN0LCByZXR1cm4gdHJ1ZSBpZiBhbGwgb2YgdGhlIHByb3ZpZGVkIGl0ZXJhdGVcbiAgICogZnVuY3Rpb24gY2FsbHMgcmV0dXJuIHRydWUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICpcbiAgICogRm9yIGNvbnZlbmllbmNlLCB0aGUgY3VycmVudCBvYmplY3QgY29udGV4dCBpcyBhcHBsaWVkIHRvIHRoZVxuICAgKiBwcm92aWRlZCBpdGVyYXRlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gIE5vZGVMaXN0IG5vZGVMaXN0IFRoZSBOb2RlTGlzdC5cbiAgICogQHBhcmFtICBGdW5jdGlvbiBmbiAgICAgICBUaGUgaXRlcmF0ZSBmdW5jdGlvbi5cbiAgICogQHJldHVybiBCb29sZWFuXG4gICAqL1xuICBfZXZlcnlOb2RlOiBmdW5jdGlvbihub2RlTGlzdCwgZm4pIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmV2ZXJ5LmNhbGwobm9kZUxpc3QsIGZuLCB0aGlzKTtcbiAgfSxcblxuICAvKipcbiAgICogQ29uY2F0IGFsbCBub2RlbGlzdHMgcGFzc2VkIGFzIGFyZ3VtZW50cy5cbiAgICpcbiAgICogQHJldHVybiAuLi5Ob2RlTGlzdFxuICAgKiBAcmV0dXJuIEFycmF5XG4gICAqL1xuICBfY29uY2F0Tm9kZUxpc3RzOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgdmFyIG5vZGVMaXN0cyA9IGFyZ3MubWFwKGZ1bmN0aW9uKGxpc3QpIHtcbiAgICAgIHJldHVybiBzbGljZS5jYWxsKGxpc3QpO1xuICAgIH0pO1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBub2RlTGlzdHMpO1xuICB9LFxuXG4gIF9nZXRBbGxOb2Rlc1dpdGhUYWc6IGZ1bmN0aW9uKG5vZGUsIHRhZ05hbWVzKSB7XG4gICAgaWYgKG5vZGUucXVlcnlTZWxlY3RvckFsbCkge1xuICAgICAgcmV0dXJuIG5vZGUucXVlcnlTZWxlY3RvckFsbCh0YWdOYW1lcy5qb2luKFwiLFwiKSk7XG4gICAgfVxuICAgIHJldHVybiBbXS5jb25jYXQuYXBwbHkoW10sIHRhZ05hbWVzLm1hcChmdW5jdGlvbih0YWcpIHtcbiAgICAgIHZhciBjb2xsZWN0aW9uID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWcpO1xuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoY29sbGVjdGlvbikgPyBjb2xsZWN0aW9uIDogQXJyYXkuZnJvbShjb2xsZWN0aW9uKTtcbiAgICB9KSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhlIGNsYXNzPVwiXCIgYXR0cmlidXRlIGZyb20gZXZlcnkgZWxlbWVudCBpbiB0aGUgZ2l2ZW5cbiAgICogc3VidHJlZSwgZXhjZXB0IHRob3NlIHRoYXQgbWF0Y2ggQ0xBU1NFU19UT19QUkVTRVJWRSBhbmRcbiAgICogdGhlIGNsYXNzZXNUb1ByZXNlcnZlIGFycmF5IGZyb20gdGhlIG9wdGlvbnMgb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcmV0dXJuIHZvaWRcbiAgICovXG4gIF9jbGVhbkNsYXNzZXM6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICB2YXIgY2xhc3Nlc1RvUHJlc2VydmUgPSB0aGlzLl9jbGFzc2VzVG9QcmVzZXJ2ZTtcbiAgICB2YXIgY2xhc3NOYW1lID0gKG5vZGUuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikgfHwgXCJcIilcbiAgICAgIC5zcGxpdCgvXFxzKy8pXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uKGNscykge1xuICAgICAgICByZXR1cm4gY2xhc3Nlc1RvUHJlc2VydmUuaW5kZXhPZihjbHMpICE9IC0xO1xuICAgICAgfSlcbiAgICAgIC5qb2luKFwiIFwiKTtcblxuICAgIGlmIChjbGFzc05hbWUpIHtcbiAgICAgIG5vZGUuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgY2xhc3NOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoXCJjbGFzc1wiKTtcbiAgICB9XG5cbiAgICBmb3IgKG5vZGUgPSBub2RlLmZpcnN0RWxlbWVudENoaWxkOyBub2RlOyBub2RlID0gbm9kZS5uZXh0RWxlbWVudFNpYmxpbmcpIHtcbiAgICAgIHRoaXMuX2NsZWFuQ2xhc3Nlcyhub2RlKTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGVhY2ggPGE+IGFuZCA8aW1nPiB1cmkgaW4gdGhlIGdpdmVuIGVsZW1lbnQgdG8gYW4gYWJzb2x1dGUgVVJJLFxuICAgKiBpZ25vcmluZyAjcmVmIFVSSXMuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEByZXR1cm4gdm9pZFxuICAgKi9cbiAgX2ZpeFJlbGF0aXZlVXJpczogZnVuY3Rpb24oYXJ0aWNsZUNvbnRlbnQpIHtcbiAgICB2YXIgYmFzZVVSSSA9IHRoaXMuX2RvYy5iYXNlVVJJO1xuICAgIHZhciBkb2N1bWVudFVSSSA9IHRoaXMuX2RvYy5kb2N1bWVudFVSSTtcbiAgICBmdW5jdGlvbiB0b0Fic29sdXRlVVJJKHVyaSkge1xuICAgICAgLy8gTGVhdmUgaGFzaCBsaW5rcyBhbG9uZSBpZiB0aGUgYmFzZSBVUkkgbWF0Y2hlcyB0aGUgZG9jdW1lbnQgVVJJOlxuICAgICAgaWYgKGJhc2VVUkkgPT0gZG9jdW1lbnRVUkkgJiYgdXJpLmNoYXJBdCgwKSA9PSBcIiNcIikge1xuICAgICAgICByZXR1cm4gdXJpO1xuICAgICAgfVxuXG4gICAgICAvLyBPdGhlcndpc2UsIHJlc29sdmUgYWdhaW5zdCBiYXNlIFVSSTpcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBuZXcgVVJMKHVyaSwgYmFzZVVSSSkuaHJlZjtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIC8vIFNvbWV0aGluZyB3ZW50IHdyb25nLCBqdXN0IHJldHVybiB0aGUgb3JpZ2luYWw6XG4gICAgICB9XG4gICAgICByZXR1cm4gdXJpO1xuICAgIH1cblxuICAgIHZhciBsaW5rcyA9IHRoaXMuX2dldEFsbE5vZGVzV2l0aFRhZyhhcnRpY2xlQ29udGVudCwgW1wiYVwiXSk7XG4gICAgdGhpcy5fZm9yRWFjaE5vZGUobGlua3MsIGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgIHZhciBocmVmID0gbGluay5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpO1xuICAgICAgaWYgKGhyZWYpIHtcbiAgICAgICAgLy8gUmVtb3ZlIGxpbmtzIHdpdGggamF2YXNjcmlwdDogVVJJcywgc2luY2VcbiAgICAgICAgLy8gdGhleSB3b24ndCB3b3JrIGFmdGVyIHNjcmlwdHMgaGF2ZSBiZWVuIHJlbW92ZWQgZnJvbSB0aGUgcGFnZS5cbiAgICAgICAgaWYgKGhyZWYuaW5kZXhPZihcImphdmFzY3JpcHQ6XCIpID09PSAwKSB7XG4gICAgICAgICAgLy8gaWYgdGhlIGxpbmsgb25seSBjb250YWlucyBzaW1wbGUgdGV4dCBjb250ZW50LCBpdCBjYW4gYmUgY29udmVydGVkIHRvIGEgdGV4dCBub2RlXG4gICAgICAgICAgaWYgKGxpbmsuY2hpbGROb2Rlcy5sZW5ndGggPT09IDEgJiYgbGluay5jaGlsZE5vZGVzWzBdLm5vZGVUeXBlID09PSB0aGlzLlRFWFRfTk9ERSkge1xuICAgICAgICAgICAgdmFyIHRleHQgPSB0aGlzLl9kb2MuY3JlYXRlVGV4dE5vZGUobGluay50ZXh0Q29udGVudCk7XG4gICAgICAgICAgICBsaW5rLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKHRleHQsIGxpbmspO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBpZiB0aGUgbGluayBoYXMgbXVsdGlwbGUgY2hpbGRyZW4sIHRoZXkgc2hvdWxkIGFsbCBiZSBwcmVzZXJ2ZWRcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLl9kb2MuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgICAgICB3aGlsZSAobGluay5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChsaW5rLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGluay5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChjb250YWluZXIsIGxpbmspO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaW5rLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgdG9BYnNvbHV0ZVVSSShocmVmKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBtZWRpYXMgPSB0aGlzLl9nZXRBbGxOb2Rlc1dpdGhUYWcoYXJ0aWNsZUNvbnRlbnQsIFtcbiAgICAgIFwiaW1nXCIsIFwicGljdHVyZVwiLCBcImZpZ3VyZVwiLCBcInZpZGVvXCIsIFwiYXVkaW9cIiwgXCJzb3VyY2VcIlxuICAgIF0pO1xuXG4gICAgdGhpcy5fZm9yRWFjaE5vZGUobWVkaWFzLCBmdW5jdGlvbihtZWRpYSkge1xuICAgICAgdmFyIHNyYyA9IG1lZGlhLmdldEF0dHJpYnV0ZShcInNyY1wiKTtcbiAgICAgIHZhciBwb3N0ZXIgPSBtZWRpYS5nZXRBdHRyaWJ1dGUoXCJwb3N0ZXJcIik7XG4gICAgICB2YXIgc3Jjc2V0ID0gbWVkaWEuZ2V0QXR0cmlidXRlKFwic3Jjc2V0XCIpO1xuXG4gICAgICBpZiAoc3JjKSB7XG4gICAgICAgIG1lZGlhLnNldEF0dHJpYnV0ZShcInNyY1wiLCB0b0Fic29sdXRlVVJJKHNyYykpO1xuICAgICAgfVxuXG4gICAgICBpZiAocG9zdGVyKSB7XG4gICAgICAgIG1lZGlhLnNldEF0dHJpYnV0ZShcInBvc3RlclwiLCB0b0Fic29sdXRlVVJJKHBvc3RlcikpO1xuICAgICAgfVxuXG4gICAgICBpZiAoc3Jjc2V0KSB7XG4gICAgICAgIHZhciBuZXdTcmNzZXQgPSBzcmNzZXQucmVwbGFjZSh0aGlzLlJFR0VYUFMuc3Jjc2V0VXJsLCBmdW5jdGlvbihfLCBwMSwgcDIsIHAzKSB7XG4gICAgICAgICAgcmV0dXJuIHRvQWJzb2x1dGVVUkkocDEpICsgKHAyIHx8IFwiXCIpICsgcDM7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1lZGlhLnNldEF0dHJpYnV0ZShcInNyY3NldFwiLCBuZXdTcmNzZXQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIF9zaW1wbGlmeU5lc3RlZEVsZW1lbnRzOiBmdW5jdGlvbihhcnRpY2xlQ29udGVudCkge1xuICAgIHZhciBub2RlID0gYXJ0aWNsZUNvbnRlbnQ7XG5cbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgaWYgKG5vZGUucGFyZW50Tm9kZSAmJiBbXCJESVZcIiwgXCJTRUNUSU9OXCJdLmluY2x1ZGVzKG5vZGUudGFnTmFtZSkgJiYgIShub2RlLmlkICYmIG5vZGUuaWQuc3RhcnRzV2l0aChcInJlYWRhYmlsaXR5XCIpKSkge1xuICAgICAgICBpZiAodGhpcy5faXNFbGVtZW50V2l0aG91dENvbnRlbnQobm9kZSkpIHtcbiAgICAgICAgICBub2RlID0gdGhpcy5fcmVtb3ZlQW5kR2V0TmV4dChub2RlKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9oYXNTaW5nbGVUYWdJbnNpZGVFbGVtZW50KG5vZGUsIFwiRElWXCIpIHx8IHRoaXMuX2hhc1NpbmdsZVRhZ0luc2lkZUVsZW1lbnQobm9kZSwgXCJTRUNUSU9OXCIpKSB7XG4gICAgICAgICAgdmFyIGNoaWxkID0gbm9kZS5jaGlsZHJlblswXTtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY2hpbGQuc2V0QXR0cmlidXRlKG5vZGUuYXR0cmlidXRlc1tpXS5uYW1lLCBub2RlLmF0dHJpYnV0ZXNbaV0udmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBub2RlLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGNoaWxkLCBub2RlKTtcbiAgICAgICAgICBub2RlID0gY2hpbGQ7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbm9kZSA9IHRoaXMuX2dldE5leHROb2RlKG5vZGUpO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogR2V0IHRoZSBhcnRpY2xlIHRpdGxlIGFzIGFuIEgxLlxuICAgKlxuICAgKiBAcmV0dXJuIHN0cmluZ1xuICAgKiovXG4gIF9nZXRBcnRpY2xlVGl0bGU6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkb2MgPSB0aGlzLl9kb2M7XG4gICAgdmFyIGN1clRpdGxlID0gXCJcIjtcbiAgICB2YXIgb3JpZ1RpdGxlID0gXCJcIjtcblxuICAgIHRyeSB7XG4gICAgICBjdXJUaXRsZSA9IG9yaWdUaXRsZSA9IGRvYy50aXRsZS50cmltKCk7XG5cbiAgICAgIC8vIElmIHRoZXkgaGFkIGFuIGVsZW1lbnQgd2l0aCBpZCBcInRpdGxlXCIgaW4gdGhlaXIgSFRNTFxuICAgICAgaWYgKHR5cGVvZiBjdXJUaXRsZSAhPT0gXCJzdHJpbmdcIilcbiAgICAgICAgY3VyVGl0bGUgPSBvcmlnVGl0bGUgPSB0aGlzLl9nZXRJbm5lclRleHQoZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidGl0bGVcIilbMF0pO1xuICAgIH0gY2F0Y2ggKGUpIHsvKiBpZ25vcmUgZXhjZXB0aW9ucyBzZXR0aW5nIHRoZSB0aXRsZS4gKi99XG5cbiAgICB2YXIgdGl0bGVIYWRIaWVyYXJjaGljYWxTZXBhcmF0b3JzID0gZmFsc2U7XG4gICAgZnVuY3Rpb24gd29yZENvdW50KHN0cikge1xuICAgICAgcmV0dXJuIHN0ci5zcGxpdCgvXFxzKy8pLmxlbmd0aDtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSdzIGEgc2VwYXJhdG9yIGluIHRoZSB0aXRsZSwgZmlyc3QgcmVtb3ZlIHRoZSBmaW5hbCBwYXJ0XG4gICAgaWYgKCgvIFtcXHxcXC1cXFxcXFwvPsK7XSAvKS50ZXN0KGN1clRpdGxlKSkge1xuICAgICAgdGl0bGVIYWRIaWVyYXJjaGljYWxTZXBhcmF0b3JzID0gLyBbXFxcXFxcLz7Cu10gLy50ZXN0KGN1clRpdGxlKTtcbiAgICAgIGN1clRpdGxlID0gb3JpZ1RpdGxlLnJlcGxhY2UoLyguKilbXFx8XFwtXFxcXFxcLz7Cu10gLiovZ2ksIFwiJDFcIik7XG5cbiAgICAgIC8vIElmIHRoZSByZXN1bHRpbmcgdGl0bGUgaXMgdG9vIHNob3J0ICgzIHdvcmRzIG9yIGZld2VyKSwgcmVtb3ZlXG4gICAgICAvLyB0aGUgZmlyc3QgcGFydCBpbnN0ZWFkOlxuICAgICAgaWYgKHdvcmRDb3VudChjdXJUaXRsZSkgPCAzKVxuICAgICAgICBjdXJUaXRsZSA9IG9yaWdUaXRsZS5yZXBsYWNlKC9bXlxcfFxcLVxcXFxcXC8+wrtdKltcXHxcXC1cXFxcXFwvPsK7XSguKikvZ2ksIFwiJDFcIik7XG4gICAgfSBlbHNlIGlmIChjdXJUaXRsZS5pbmRleE9mKFwiOiBcIikgIT09IC0xKSB7XG4gICAgICAvLyBDaGVjayBpZiB3ZSBoYXZlIGFuIGhlYWRpbmcgY29udGFpbmluZyB0aGlzIGV4YWN0IHN0cmluZywgc28gd2VcbiAgICAgIC8vIGNvdWxkIGFzc3VtZSBpdCdzIHRoZSBmdWxsIHRpdGxlLlxuICAgICAgdmFyIGhlYWRpbmdzID0gdGhpcy5fY29uY2F0Tm9kZUxpc3RzKFxuICAgICAgICBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJoMVwiKSxcbiAgICAgICAgZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaDJcIilcbiAgICAgICk7XG4gICAgICB2YXIgdHJpbW1lZFRpdGxlID0gY3VyVGl0bGUudHJpbSgpO1xuICAgICAgdmFyIG1hdGNoID0gdGhpcy5fc29tZU5vZGUoaGVhZGluZ3MsIGZ1bmN0aW9uKGhlYWRpbmcpIHtcbiAgICAgICAgcmV0dXJuIGhlYWRpbmcudGV4dENvbnRlbnQudHJpbSgpID09PSB0cmltbWVkVGl0bGU7XG4gICAgICB9KTtcblxuICAgICAgLy8gSWYgd2UgZG9uJ3QsIGxldCdzIGV4dHJhY3QgdGhlIHRpdGxlIG91dCBvZiB0aGUgb3JpZ2luYWwgdGl0bGUgc3RyaW5nLlxuICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICBjdXJUaXRsZSA9IG9yaWdUaXRsZS5zdWJzdHJpbmcob3JpZ1RpdGxlLmxhc3RJbmRleE9mKFwiOlwiKSArIDEpO1xuXG4gICAgICAgIC8vIElmIHRoZSB0aXRsZSBpcyBub3cgdG9vIHNob3J0LCB0cnkgdGhlIGZpcnN0IGNvbG9uIGluc3RlYWQ6XG4gICAgICAgIGlmICh3b3JkQ291bnQoY3VyVGl0bGUpIDwgMykge1xuICAgICAgICAgIGN1clRpdGxlID0gb3JpZ1RpdGxlLnN1YnN0cmluZyhvcmlnVGl0bGUuaW5kZXhPZihcIjpcIikgKyAxKTtcbiAgICAgICAgICAvLyBCdXQgaWYgd2UgaGF2ZSB0b28gbWFueSB3b3JkcyBiZWZvcmUgdGhlIGNvbG9uIHRoZXJlJ3Mgc29tZXRoaW5nIHdlaXJkXG4gICAgICAgICAgLy8gd2l0aCB0aGUgdGl0bGVzIGFuZCB0aGUgSCB0YWdzIHNvIGxldCdzIGp1c3QgdXNlIHRoZSBvcmlnaW5hbCB0aXRsZSBpbnN0ZWFkXG4gICAgICAgIH0gZWxzZSBpZiAod29yZENvdW50KG9yaWdUaXRsZS5zdWJzdHIoMCwgb3JpZ1RpdGxlLmluZGV4T2YoXCI6XCIpKSkgPiA1KSB7XG4gICAgICAgICAgY3VyVGl0bGUgPSBvcmlnVGl0bGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGN1clRpdGxlLmxlbmd0aCA+IDE1MCB8fCBjdXJUaXRsZS5sZW5ndGggPCAxNSkge1xuICAgICAgdmFyIGhPbmVzID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaDFcIik7XG5cbiAgICAgIGlmIChoT25lcy5sZW5ndGggPT09IDEpXG4gICAgICAgIGN1clRpdGxlID0gdGhpcy5fZ2V0SW5uZXJUZXh0KGhPbmVzWzBdKTtcbiAgICB9XG5cbiAgICBjdXJUaXRsZSA9IGN1clRpdGxlLnRyaW0oKS5yZXBsYWNlKHRoaXMuUkVHRVhQUy5ub3JtYWxpemUsIFwiIFwiKTtcbiAgICAvLyBJZiB3ZSBub3cgaGF2ZSA0IHdvcmRzIG9yIGZld2VyIGFzIG91ciB0aXRsZSwgYW5kIGVpdGhlciBub1xuICAgIC8vICdoaWVyYXJjaGljYWwnIHNlcGFyYXRvcnMgKFxcLCAvLCA+IG9yIMK7KSB3ZXJlIGZvdW5kIGluIHRoZSBvcmlnaW5hbFxuICAgIC8vIHRpdGxlIG9yIHdlIGRlY3JlYXNlZCB0aGUgbnVtYmVyIG9mIHdvcmRzIGJ5IG1vcmUgdGhhbiAxIHdvcmQsIHVzZVxuICAgIC8vIHRoZSBvcmlnaW5hbCB0aXRsZS5cbiAgICB2YXIgY3VyVGl0bGVXb3JkQ291bnQgPSB3b3JkQ291bnQoY3VyVGl0bGUpO1xuICAgIGlmIChjdXJUaXRsZVdvcmRDb3VudCA8PSA0ICYmXG4gICAgICAgICghdGl0bGVIYWRIaWVyYXJjaGljYWxTZXBhcmF0b3JzIHx8XG4gICAgICAgICBjdXJUaXRsZVdvcmRDb3VudCAhPSB3b3JkQ291bnQob3JpZ1RpdGxlLnJlcGxhY2UoL1tcXHxcXC1cXFxcXFwvPsK7XSsvZywgXCJcIikpIC0gMSkpIHtcbiAgICAgIGN1clRpdGxlID0gb3JpZ1RpdGxlO1xuICAgIH1cblxuICAgIHJldHVybiBjdXJUaXRsZTtcbiAgfSxcblxuICAvKipcbiAgICogUHJlcGFyZSB0aGUgSFRNTCBkb2N1bWVudCBmb3IgcmVhZGFiaWxpdHkgdG8gc2NyYXBlIGl0LlxuICAgKiBUaGlzIGluY2x1ZGVzIHRoaW5ncyBsaWtlIHN0cmlwcGluZyBqYXZhc2NyaXB0LCBDU1MsIGFuZCBoYW5kbGluZyB0ZXJyaWJsZSBtYXJrdXAuXG4gICAqXG4gICAqIEByZXR1cm4gdm9pZFxuICAgKiovXG4gIF9wcmVwRG9jdW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkb2MgPSB0aGlzLl9kb2M7XG5cbiAgICAvLyBSZW1vdmUgYWxsIHN0eWxlIHRhZ3MgaW4gaGVhZFxuICAgIHRoaXMuX3JlbW92ZU5vZGVzKHRoaXMuX2dldEFsbE5vZGVzV2l0aFRhZyhkb2MsIFtcInN0eWxlXCJdKSk7XG5cbiAgICBpZiAoZG9jLmJvZHkpIHtcbiAgICAgIHRoaXMuX3JlcGxhY2VCcnMoZG9jLmJvZHkpO1xuICAgIH1cblxuICAgIHRoaXMuX3JlcGxhY2VOb2RlVGFncyh0aGlzLl9nZXRBbGxOb2Rlc1dpdGhUYWcoZG9jLCBbXCJmb250XCJdKSwgXCJTUEFOXCIpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBGaW5kcyB0aGUgbmV4dCBub2RlLCBzdGFydGluZyBmcm9tIHRoZSBnaXZlbiBub2RlLCBhbmQgaWdub3JpbmdcbiAgICogd2hpdGVzcGFjZSBpbiBiZXR3ZWVuLiBJZiB0aGUgZ2l2ZW4gbm9kZSBpcyBhbiBlbGVtZW50LCB0aGUgc2FtZSBub2RlIGlzXG4gICAqIHJldHVybmVkLlxuICAgKi9cbiAgX25leHROb2RlOiBmdW5jdGlvbiAobm9kZSkge1xuICAgIHZhciBuZXh0ID0gbm9kZTtcbiAgICB3aGlsZSAobmV4dFxuICAgICAgICAmJiAobmV4dC5ub2RlVHlwZSAhPSB0aGlzLkVMRU1FTlRfTk9ERSlcbiAgICAgICAgJiYgdGhpcy5SRUdFWFBTLndoaXRlc3BhY2UudGVzdChuZXh0LnRleHRDb250ZW50KSkge1xuICAgICAgbmV4dCA9IG5leHQubmV4dFNpYmxpbmc7XG4gICAgfVxuICAgIHJldHVybiBuZXh0O1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXBsYWNlcyAyIG9yIG1vcmUgc3VjY2Vzc2l2ZSA8YnI+IGVsZW1lbnRzIHdpdGggYSBzaW5nbGUgPHA+LlxuICAgKiBXaGl0ZXNwYWNlIGJldHdlZW4gPGJyPiBlbGVtZW50cyBhcmUgaWdub3JlZC4gRm9yIGV4YW1wbGU6XG4gICAqICAgPGRpdj5mb288YnI+YmFyPGJyPiA8YnI+PGJyPmFiYzwvZGl2PlxuICAgKiB3aWxsIGJlY29tZTpcbiAgICogICA8ZGl2PmZvbzxicj5iYXI8cD5hYmM8L3A+PC9kaXY+XG4gICAqL1xuICBfcmVwbGFjZUJyczogZnVuY3Rpb24gKGVsZW0pIHtcbiAgICB0aGlzLl9mb3JFYWNoTm9kZSh0aGlzLl9nZXRBbGxOb2Rlc1dpdGhUYWcoZWxlbSwgW1wiYnJcIl0pLCBmdW5jdGlvbihicikge1xuICAgICAgdmFyIG5leHQgPSBici5uZXh0U2libGluZztcblxuICAgICAgLy8gV2hldGhlciAyIG9yIG1vcmUgPGJyPiBlbGVtZW50cyBoYXZlIGJlZW4gZm91bmQgYW5kIHJlcGxhY2VkIHdpdGggYVxuICAgICAgLy8gPHA+IGJsb2NrLlxuICAgICAgdmFyIHJlcGxhY2VkID0gZmFsc2U7XG5cbiAgICAgIC8vIElmIHdlIGZpbmQgYSA8YnI+IGNoYWluLCByZW1vdmUgdGhlIDxicj5zIHVudGlsIHdlIGhpdCBhbm90aGVyIG5vZGVcbiAgICAgIC8vIG9yIG5vbi13aGl0ZXNwYWNlLiBUaGlzIGxlYXZlcyBiZWhpbmQgdGhlIGZpcnN0IDxicj4gaW4gdGhlIGNoYWluXG4gICAgICAvLyAod2hpY2ggd2lsbCBiZSByZXBsYWNlZCB3aXRoIGEgPHA+IGxhdGVyKS5cbiAgICAgIHdoaWxlICgobmV4dCA9IHRoaXMuX25leHROb2RlKG5leHQpKSAmJiAobmV4dC50YWdOYW1lID09IFwiQlJcIikpIHtcbiAgICAgICAgcmVwbGFjZWQgPSB0cnVlO1xuICAgICAgICB2YXIgYnJTaWJsaW5nID0gbmV4dC5uZXh0U2libGluZztcbiAgICAgICAgbmV4dC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5leHQpO1xuICAgICAgICBuZXh0ID0gYnJTaWJsaW5nO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB3ZSByZW1vdmVkIGEgPGJyPiBjaGFpbiwgcmVwbGFjZSB0aGUgcmVtYWluaW5nIDxicj4gd2l0aCBhIDxwPi4gQWRkXG4gICAgICAvLyBhbGwgc2libGluZyBub2RlcyBhcyBjaGlsZHJlbiBvZiB0aGUgPHA+IHVudGlsIHdlIGhpdCBhbm90aGVyIDxicj5cbiAgICAgIC8vIGNoYWluLlxuICAgICAgaWYgKHJlcGxhY2VkKSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5fZG9jLmNyZWF0ZUVsZW1lbnQoXCJwXCIpO1xuICAgICAgICBici5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChwLCBicik7XG5cbiAgICAgICAgbmV4dCA9IHAubmV4dFNpYmxpbmc7XG4gICAgICAgIHdoaWxlIChuZXh0KSB7XG4gICAgICAgICAgLy8gSWYgd2UndmUgaGl0IGFub3RoZXIgPGJyPjxicj4sIHdlJ3JlIGRvbmUgYWRkaW5nIGNoaWxkcmVuIHRvIHRoaXMgPHA+LlxuICAgICAgICAgIGlmIChuZXh0LnRhZ05hbWUgPT0gXCJCUlwiKSB7XG4gICAgICAgICAgICB2YXIgbmV4dEVsZW0gPSB0aGlzLl9uZXh0Tm9kZShuZXh0Lm5leHRTaWJsaW5nKTtcbiAgICAgICAgICAgIGlmIChuZXh0RWxlbSAmJiBuZXh0RWxlbS50YWdOYW1lID09IFwiQlJcIilcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCF0aGlzLl9pc1BocmFzaW5nQ29udGVudChuZXh0KSlcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgLy8gT3RoZXJ3aXNlLCBtYWtlIHRoaXMgbm9kZSBhIGNoaWxkIG9mIHRoZSBuZXcgPHA+LlxuICAgICAgICAgIHZhciBzaWJsaW5nID0gbmV4dC5uZXh0U2libGluZztcbiAgICAgICAgICBwLmFwcGVuZENoaWxkKG5leHQpO1xuICAgICAgICAgIG5leHQgPSBzaWJsaW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKHAubGFzdENoaWxkICYmIHRoaXMuX2lzV2hpdGVzcGFjZShwLmxhc3RDaGlsZCkpIHtcbiAgICAgICAgICBwLnJlbW92ZUNoaWxkKHAubGFzdENoaWxkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwLnBhcmVudE5vZGUudGFnTmFtZSA9PT0gXCJQXCIpXG4gICAgICAgICAgdGhpcy5fc2V0Tm9kZVRhZyhwLnBhcmVudE5vZGUsIFwiRElWXCIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIF9zZXROb2RlVGFnOiBmdW5jdGlvbiAobm9kZSwgdGFnKSB7XG4gICAgdGhpcy5sb2coXCJfc2V0Tm9kZVRhZ1wiLCBub2RlLCB0YWcpO1xuICAgIGlmICh0aGlzLl9kb2NKU0RPTVBhcnNlcikge1xuICAgICAgbm9kZS5sb2NhbE5hbWUgPSB0YWcudG9Mb3dlckNhc2UoKTtcbiAgICAgIG5vZGUudGFnTmFtZSA9IHRhZy50b1VwcGVyQ2FzZSgpO1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgdmFyIHJlcGxhY2VtZW50ID0gbm9kZS5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgICB3aGlsZSAobm9kZS5maXJzdENoaWxkKSB7XG4gICAgICByZXBsYWNlbWVudC5hcHBlbmRDaGlsZChub2RlLmZpcnN0Q2hpbGQpO1xuICAgIH1cbiAgICBub2RlLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKHJlcGxhY2VtZW50LCBub2RlKTtcbiAgICBpZiAobm9kZS5yZWFkYWJpbGl0eSlcbiAgICAgIHJlcGxhY2VtZW50LnJlYWRhYmlsaXR5ID0gbm9kZS5yZWFkYWJpbGl0eTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXBsYWNlbWVudC5zZXRBdHRyaWJ1dGUobm9kZS5hdHRyaWJ1dGVzW2ldLm5hbWUsIG5vZGUuYXR0cmlidXRlc1tpXS52YWx1ZSk7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAvKiBpdCdzIHBvc3NpYmxlIGZvciBzZXRBdHRyaWJ1dGUoKSB0byB0aHJvdyBpZiB0aGUgYXR0cmlidXRlIG5hbWVcbiAgICAgICAgICogaXNuJ3QgYSB2YWxpZCBYTUwgTmFtZS4gU3VjaCBhdHRyaWJ1dGVzIGNhbiBob3dldmVyIGJlIHBhcnNlZCBmcm9tXG4gICAgICAgICAqIHNvdXJjZSBpbiBIVE1MIGRvY3MsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vd2hhdHdnL2h0bWwvaXNzdWVzLzQyNzUsXG4gICAgICAgICAqIHNvIHdlIGNhbiBoaXQgdGhlbSBoZXJlIGFuZCB0aGVuIHRocm93LiBXZSBkb24ndCBjYXJlIGFib3V0IHN1Y2hcbiAgICAgICAgICogYXR0cmlidXRlcyBzbyB3ZSBpZ25vcmUgdGhlbS5cbiAgICAgICAgICovXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXBsYWNlbWVudDtcbiAgfSxcblxuICAvKipcbiAgICogUHJlcGFyZSB0aGUgYXJ0aWNsZSBub2RlIGZvciBkaXNwbGF5LiBDbGVhbiBvdXQgYW55IGlubGluZSBzdHlsZXMsXG4gICAqIGlmcmFtZXMsIGZvcm1zLCBzdHJpcCBleHRyYW5lb3VzIDxwPiB0YWdzLCBldGMuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEByZXR1cm4gdm9pZFxuICAgKiovXG4gIF9wcmVwQXJ0aWNsZTogZnVuY3Rpb24oYXJ0aWNsZUNvbnRlbnQpIHtcbiAgICB0aGlzLl9jbGVhblN0eWxlcyhhcnRpY2xlQ29udGVudCk7XG5cbiAgICAvLyBDaGVjayBmb3IgZGF0YSB0YWJsZXMgYmVmb3JlIHdlIGNvbnRpbnVlLCB0byBhdm9pZCByZW1vdmluZyBpdGVtcyBpblxuICAgIC8vIHRob3NlIHRhYmxlcywgd2hpY2ggd2lsbCBvZnRlbiBiZSBpc29sYXRlZCBldmVuIHRob3VnaCB0aGV5J3JlXG4gICAgLy8gdmlzdWFsbHkgbGlua2VkIHRvIG90aGVyIGNvbnRlbnQtZnVsIGVsZW1lbnRzICh0ZXh0LCBpbWFnZXMsIGV0Yy4pLlxuICAgIHRoaXMuX21hcmtEYXRhVGFibGVzKGFydGljbGVDb250ZW50KTtcblxuICAgIHRoaXMuX2ZpeExhenlJbWFnZXMoYXJ0aWNsZUNvbnRlbnQpO1xuXG4gICAgLy8gQ2xlYW4gb3V0IGp1bmsgZnJvbSB0aGUgYXJ0aWNsZSBjb250ZW50XG4gICAgdGhpcy5fY2xlYW5Db25kaXRpb25hbGx5KGFydGljbGVDb250ZW50LCBcImZvcm1cIik7XG4gICAgdGhpcy5fY2xlYW5Db25kaXRpb25hbGx5KGFydGljbGVDb250ZW50LCBcImZpZWxkc2V0XCIpO1xuICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcIm9iamVjdFwiKTtcbiAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJlbWJlZFwiKTtcbiAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJmb290ZXJcIik7XG4gICAgdGhpcy5fY2xlYW4oYXJ0aWNsZUNvbnRlbnQsIFwibGlua1wiKTtcbiAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJhc2lkZVwiKTtcblxuICAgIC8vIENsZWFuIG91dCBlbGVtZW50cyB3aXRoIGxpdHRsZSBjb250ZW50IHRoYXQgaGF2ZSBcInNoYXJlXCIgaW4gdGhlaXIgaWQvY2xhc3MgY29tYmluYXRpb25zIGZyb20gZmluYWwgdG9wIGNhbmRpZGF0ZXMsXG4gICAgLy8gd2hpY2ggbWVhbnMgd2UgZG9uJ3QgcmVtb3ZlIHRoZSB0b3AgY2FuZGlkYXRlcyBldmVuIHRoZXkgaGF2ZSBcInNoYXJlXCIuXG5cbiAgICB2YXIgc2hhcmVFbGVtZW50VGhyZXNob2xkID0gdGhpcy5ERUZBVUxUX0NIQVJfVEhSRVNIT0xEO1xuXG4gICAgdGhpcy5fZm9yRWFjaE5vZGUoYXJ0aWNsZUNvbnRlbnQuY2hpbGRyZW4sIGZ1bmN0aW9uICh0b3BDYW5kaWRhdGUpIHtcbiAgICAgIHRoaXMuX2NsZWFuTWF0Y2hlZE5vZGVzKHRvcENhbmRpZGF0ZSwgZnVuY3Rpb24gKG5vZGUsIG1hdGNoU3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLlJFR0VYUFMuc2hhcmVFbGVtZW50cy50ZXN0KG1hdGNoU3RyaW5nKSAmJiBub2RlLnRleHRDb250ZW50Lmxlbmd0aCA8IHNoYXJlRWxlbWVudFRocmVzaG9sZDtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fY2xlYW4oYXJ0aWNsZUNvbnRlbnQsIFwiaWZyYW1lXCIpO1xuICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcImlucHV0XCIpO1xuICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcInRleHRhcmVhXCIpO1xuICAgIHRoaXMuX2NsZWFuKGFydGljbGVDb250ZW50LCBcInNlbGVjdFwiKTtcbiAgICB0aGlzLl9jbGVhbihhcnRpY2xlQ29udGVudCwgXCJidXR0b25cIik7XG4gICAgdGhpcy5fY2xlYW5IZWFkZXJzKGFydGljbGVDb250ZW50KTtcblxuICAgIC8vIERvIHRoZXNlIGxhc3QgYXMgdGhlIHByZXZpb3VzIHN0dWZmIG1heSBoYXZlIHJlbW92ZWQganVua1xuICAgIC8vIHRoYXQgd2lsbCBhZmZlY3QgdGhlc2VcbiAgICB0aGlzLl9jbGVhbkNvbmRpdGlvbmFsbHkoYXJ0aWNsZUNvbnRlbnQsIFwidGFibGVcIik7XG4gICAgdGhpcy5fY2xlYW5Db25kaXRpb25hbGx5KGFydGljbGVDb250ZW50LCBcInVsXCIpO1xuICAgIHRoaXMuX2NsZWFuQ29uZGl0aW9uYWxseShhcnRpY2xlQ29udGVudCwgXCJkaXZcIik7XG5cbiAgICAvLyByZXBsYWNlIEgxIHdpdGggSDIgYXMgSDEgc2hvdWxkIGJlIG9ubHkgdGl0bGUgdGhhdCBpcyBkaXNwbGF5ZWQgc2VwYXJhdGVseVxuICAgIHRoaXMuX3JlcGxhY2VOb2RlVGFncyh0aGlzLl9nZXRBbGxOb2Rlc1dpdGhUYWcoYXJ0aWNsZUNvbnRlbnQsIFtcImgxXCJdKSwgXCJoMlwiKTtcblxuICAgIC8vIFJlbW92ZSBleHRyYSBwYXJhZ3JhcGhzXG4gICAgdGhpcy5fcmVtb3ZlTm9kZXModGhpcy5fZ2V0QWxsTm9kZXNXaXRoVGFnKGFydGljbGVDb250ZW50LCBbXCJwXCJdKSwgZnVuY3Rpb24gKHBhcmFncmFwaCkge1xuICAgICAgdmFyIGltZ0NvdW50ID0gcGFyYWdyYXBoLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW1nXCIpLmxlbmd0aDtcbiAgICAgIHZhciBlbWJlZENvdW50ID0gcGFyYWdyYXBoLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZW1iZWRcIikubGVuZ3RoO1xuICAgICAgdmFyIG9iamVjdENvdW50ID0gcGFyYWdyYXBoLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwib2JqZWN0XCIpLmxlbmd0aDtcbiAgICAgIC8vIEF0IHRoaXMgcG9pbnQsIG5hc3R5IGlmcmFtZXMgaGF2ZSBiZWVuIHJlbW92ZWQsIG9ubHkgcmVtYWluIGVtYmVkZGVkIHZpZGVvIG9uZXMuXG4gICAgICB2YXIgaWZyYW1lQ291bnQgPSBwYXJhZ3JhcGguZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpZnJhbWVcIikubGVuZ3RoO1xuICAgICAgdmFyIHRvdGFsQ291bnQgPSBpbWdDb3VudCArIGVtYmVkQ291bnQgKyBvYmplY3RDb3VudCArIGlmcmFtZUNvdW50O1xuXG4gICAgICByZXR1cm4gdG90YWxDb3VudCA9PT0gMCAmJiAhdGhpcy5fZ2V0SW5uZXJUZXh0KHBhcmFncmFwaCwgZmFsc2UpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fZm9yRWFjaE5vZGUodGhpcy5fZ2V0QWxsTm9kZXNXaXRoVGFnKGFydGljbGVDb250ZW50LCBbXCJiclwiXSksIGZ1bmN0aW9uKGJyKSB7XG4gICAgICB2YXIgbmV4dCA9IHRoaXMuX25leHROb2RlKGJyLm5leHRTaWJsaW5nKTtcbiAgICAgIGlmIChuZXh0ICYmIG5leHQudGFnTmFtZSA9PSBcIlBcIilcbiAgICAgICAgYnIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChicik7XG4gICAgfSk7XG5cbiAgICAvLyBSZW1vdmUgc2luZ2xlLWNlbGwgdGFibGVzXG4gICAgdGhpcy5fZm9yRWFjaE5vZGUodGhpcy5fZ2V0QWxsTm9kZXNXaXRoVGFnKGFydGljbGVDb250ZW50LCBbXCJ0YWJsZVwiXSksIGZ1bmN0aW9uKHRhYmxlKSB7XG4gICAgICB2YXIgdGJvZHkgPSB0aGlzLl9oYXNTaW5nbGVUYWdJbnNpZGVFbGVtZW50KHRhYmxlLCBcIlRCT0RZXCIpID8gdGFibGUuZmlyc3RFbGVtZW50Q2hpbGQgOiB0YWJsZTtcbiAgICAgIGlmICh0aGlzLl9oYXNTaW5nbGVUYWdJbnNpZGVFbGVtZW50KHRib2R5LCBcIlRSXCIpKSB7XG4gICAgICAgIHZhciByb3cgPSB0Ym9keS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgaWYgKHRoaXMuX2hhc1NpbmdsZVRhZ0luc2lkZUVsZW1lbnQocm93LCBcIlREXCIpKSB7XG4gICAgICAgICAgdmFyIGNlbGwgPSByb3cuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgY2VsbCA9IHRoaXMuX3NldE5vZGVUYWcoY2VsbCwgdGhpcy5fZXZlcnlOb2RlKGNlbGwuY2hpbGROb2RlcywgdGhpcy5faXNQaHJhc2luZ0NvbnRlbnQpID8gXCJQXCIgOiBcIkRJVlwiKTtcbiAgICAgICAgICB0YWJsZS5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChjZWxsLCB0YWJsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBhIG5vZGUgd2l0aCB0aGUgcmVhZGFiaWxpdHkgb2JqZWN0LiBBbHNvIGNoZWNrcyB0aGVcbiAgICogY2xhc3NOYW1lL2lkIGZvciBzcGVjaWFsIG5hbWVzIHRvIGFkZCB0byBpdHMgc2NvcmUuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEByZXR1cm4gdm9pZFxuICAqKi9cbiAgX2luaXRpYWxpemVOb2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgbm9kZS5yZWFkYWJpbGl0eSA9IHtcImNvbnRlbnRTY29yZVwiOiAwfTtcblxuICAgIHN3aXRjaCAobm9kZS50YWdOYW1lKSB7XG4gICAgICBjYXNlIFwiRElWXCI6XG4gICAgICAgIG5vZGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlICs9IDU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIFwiUFJFXCI6XG4gICAgICBjYXNlIFwiVERcIjpcbiAgICAgIGNhc2UgXCJCTE9DS1FVT1RFXCI6XG4gICAgICAgIG5vZGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlICs9IDM7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIFwiQUREUkVTU1wiOlxuICAgICAgY2FzZSBcIk9MXCI6XG4gICAgICBjYXNlIFwiVUxcIjpcbiAgICAgIGNhc2UgXCJETFwiOlxuICAgICAgY2FzZSBcIkREXCI6XG4gICAgICBjYXNlIFwiRFRcIjpcbiAgICAgIGNhc2UgXCJMSVwiOlxuICAgICAgY2FzZSBcIkZPUk1cIjpcbiAgICAgICAgbm9kZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgLT0gMztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJIMVwiOlxuICAgICAgY2FzZSBcIkgyXCI6XG4gICAgICBjYXNlIFwiSDNcIjpcbiAgICAgIGNhc2UgXCJINFwiOlxuICAgICAgY2FzZSBcIkg1XCI6XG4gICAgICBjYXNlIFwiSDZcIjpcbiAgICAgIGNhc2UgXCJUSFwiOlxuICAgICAgICBub2RlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSAtPSA1O1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBub2RlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSArPSB0aGlzLl9nZXRDbGFzc1dlaWdodChub2RlKTtcbiAgfSxcblxuICBfcmVtb3ZlQW5kR2V0TmV4dDogZnVuY3Rpb24obm9kZSkge1xuICAgIHZhciBuZXh0Tm9kZSA9IHRoaXMuX2dldE5leHROb2RlKG5vZGUsIHRydWUpO1xuICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICByZXR1cm4gbmV4dE5vZGU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFRyYXZlcnNlIHRoZSBET00gZnJvbSBub2RlIHRvIG5vZGUsIHN0YXJ0aW5nIGF0IHRoZSBub2RlIHBhc3NlZCBpbi5cbiAgICogUGFzcyB0cnVlIGZvciB0aGUgc2Vjb25kIHBhcmFtZXRlciB0byBpbmRpY2F0ZSB0aGlzIG5vZGUgaXRzZWxmXG4gICAqIChhbmQgaXRzIGtpZHMpIGFyZSBnb2luZyBhd2F5LCBhbmQgd2Ugd2FudCB0aGUgbmV4dCBub2RlIG92ZXIuXG4gICAqXG4gICAqIENhbGxpbmcgdGhpcyBpbiBhIGxvb3Agd2lsbCB0cmF2ZXJzZSB0aGUgRE9NIGRlcHRoLWZpcnN0LlxuICAgKi9cbiAgX2dldE5leHROb2RlOiBmdW5jdGlvbihub2RlLCBpZ25vcmVTZWxmQW5kS2lkcykge1xuICAgIC8vIEZpcnN0IGNoZWNrIGZvciBraWRzIGlmIHRob3NlIGFyZW4ndCBiZWluZyBpZ25vcmVkXG4gICAgaWYgKCFpZ25vcmVTZWxmQW5kS2lkcyAmJiBub2RlLmZpcnN0RWxlbWVudENoaWxkKSB7XG4gICAgICByZXR1cm4gbm9kZS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICB9XG4gICAgLy8gVGhlbiBmb3Igc2libGluZ3MuLi5cbiAgICBpZiAobm9kZS5uZXh0RWxlbWVudFNpYmxpbmcpIHtcbiAgICAgIHJldHVybiBub2RlLm5leHRFbGVtZW50U2libGluZztcbiAgICB9XG4gICAgLy8gQW5kIGZpbmFsbHksIG1vdmUgdXAgdGhlIHBhcmVudCBjaGFpbiAqYW5kKiBmaW5kIGEgc2libGluZ1xuICAgIC8vIChiZWNhdXNlIHRoaXMgaXMgZGVwdGgtZmlyc3QgdHJhdmVyc2FsLCB3ZSB3aWxsIGhhdmUgYWxyZWFkeVxuICAgIC8vIHNlZW4gdGhlIHBhcmVudCBub2RlcyB0aGVtc2VsdmVzKS5cbiAgICBkbyB7XG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIH0gd2hpbGUgKG5vZGUgJiYgIW5vZGUubmV4dEVsZW1lbnRTaWJsaW5nKTtcbiAgICByZXR1cm4gbm9kZSAmJiBub2RlLm5leHRFbGVtZW50U2libGluZztcbiAgfSxcblxuICAvLyBjb21wYXJlcyBzZWNvbmQgdGV4dCB0byBmaXJzdCBvbmVcbiAgLy8gMSA9IHNhbWUgdGV4dCwgMCA9IGNvbXBsZXRlbHkgZGlmZmVyZW50IHRleHRcbiAgLy8gd29ya3MgdGhlIHdheSB0aGF0IGl0IHNwbGl0cyBib3RoIHRleHRzIGludG8gd29yZHMgYW5kIHRoZW4gZmluZHMgd29yZHMgdGhhdCBhcmUgdW5pcXVlIGluIHNlY29uZCB0ZXh0XG4gIC8vIHRoZSByZXN1bHQgaXMgZ2l2ZW4gYnkgdGhlIGxvd2VyIGxlbmd0aCBvZiB1bmlxdWUgcGFydHNcbiAgX3RleHRTaW1pbGFyaXR5OiBmdW5jdGlvbih0ZXh0QSwgdGV4dEIpIHtcbiAgICB2YXIgdG9rZW5zQSA9IHRleHRBLnRvTG93ZXJDYXNlKCkuc3BsaXQodGhpcy5SRUdFWFBTLnRva2VuaXplKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgdmFyIHRva2Vuc0IgPSB0ZXh0Qi50b0xvd2VyQ2FzZSgpLnNwbGl0KHRoaXMuUkVHRVhQUy50b2tlbml6ZSkuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGlmICghdG9rZW5zQS5sZW5ndGggfHwgIXRva2Vuc0IubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgdmFyIHVuaXFUb2tlbnNCID0gdG9rZW5zQi5maWx0ZXIodG9rZW4gPT4gIXRva2Vuc0EuaW5jbHVkZXModG9rZW4pKTtcbiAgICB2YXIgZGlzdGFuY2VCID0gdW5pcVRva2Vuc0Iuam9pbihcIiBcIikubGVuZ3RoIC8gdG9rZW5zQi5qb2luKFwiIFwiKS5sZW5ndGg7XG4gICAgcmV0dXJuIDEgLSBkaXN0YW5jZUI7XG4gIH0sXG5cbiAgX2NoZWNrQnlsaW5lOiBmdW5jdGlvbihub2RlLCBtYXRjaFN0cmluZykge1xuICAgIGlmICh0aGlzLl9hcnRpY2xlQnlsaW5lKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKG5vZGUuZ2V0QXR0cmlidXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHZhciByZWwgPSBub2RlLmdldEF0dHJpYnV0ZShcInJlbFwiKTtcbiAgICAgIHZhciBpdGVtcHJvcCA9IG5vZGUuZ2V0QXR0cmlidXRlKFwiaXRlbXByb3BcIik7XG4gICAgfVxuXG4gICAgaWYgKChyZWwgPT09IFwiYXV0aG9yXCIgfHwgKGl0ZW1wcm9wICYmIGl0ZW1wcm9wLmluZGV4T2YoXCJhdXRob3JcIikgIT09IC0xKSB8fCB0aGlzLlJFR0VYUFMuYnlsaW5lLnRlc3QobWF0Y2hTdHJpbmcpKSAmJiB0aGlzLl9pc1ZhbGlkQnlsaW5lKG5vZGUudGV4dENvbnRlbnQpKSB7XG4gICAgICB0aGlzLl9hcnRpY2xlQnlsaW5lID0gbm9kZS50ZXh0Q29udGVudC50cmltKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgX2dldE5vZGVBbmNlc3RvcnM6IGZ1bmN0aW9uKG5vZGUsIG1heERlcHRoKSB7XG4gICAgbWF4RGVwdGggPSBtYXhEZXB0aCB8fCAwO1xuICAgIHZhciBpID0gMCwgYW5jZXN0b3JzID0gW107XG4gICAgd2hpbGUgKG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgYW5jZXN0b3JzLnB1c2gobm9kZS5wYXJlbnROb2RlKTtcbiAgICAgIGlmIChtYXhEZXB0aCAmJiArK2kgPT09IG1heERlcHRoKVxuICAgICAgICBicmVhaztcbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgfVxuICAgIHJldHVybiBhbmNlc3RvcnM7XG4gIH0sXG5cbiAgLyoqKlxuICAgKiBncmFiQXJ0aWNsZSAtIFVzaW5nIGEgdmFyaWV0eSBvZiBtZXRyaWNzIChjb250ZW50IHNjb3JlLCBjbGFzc25hbWUsIGVsZW1lbnQgdHlwZXMpLCBmaW5kIHRoZSBjb250ZW50IHRoYXQgaXNcbiAgICogICAgICAgICBtb3N0IGxpa2VseSB0byBiZSB0aGUgc3R1ZmYgYSB1c2VyIHdhbnRzIHRvIHJlYWQuIFRoZW4gcmV0dXJuIGl0IHdyYXBwZWQgdXAgaW4gYSBkaXYuXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIGEgZG9jdW1lbnQgdG8gcnVuIHVwb24uIE5lZWRzIHRvIGJlIGEgZnVsbCBkb2N1bWVudCwgY29tcGxldGUgd2l0aCBib2R5LlxuICAgKiBAcmV0dXJuIEVsZW1lbnRcbiAgKiovXG4gIF9ncmFiQXJ0aWNsZTogZnVuY3Rpb24gKHBhZ2UpIHtcbiAgICB0aGlzLmxvZyhcIioqKiogZ3JhYkFydGljbGUgKioqKlwiKTtcbiAgICB2YXIgZG9jID0gdGhpcy5fZG9jO1xuICAgIHZhciBpc1BhZ2luZyA9IHBhZ2UgIT09IG51bGw7XG4gICAgcGFnZSA9IHBhZ2UgPyBwYWdlIDogdGhpcy5fZG9jLmJvZHk7XG5cbiAgICAvLyBXZSBjYW4ndCBncmFiIGFuIGFydGljbGUgaWYgd2UgZG9uJ3QgaGF2ZSBhIHBhZ2UhXG4gICAgaWYgKCFwYWdlKSB7XG4gICAgICB0aGlzLmxvZyhcIk5vIGJvZHkgZm91bmQgaW4gZG9jdW1lbnQuIEFib3J0LlwiKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciBwYWdlQ2FjaGVIdG1sID0gcGFnZS5pbm5lckhUTUw7XG5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgdGhpcy5sb2coXCJTdGFydGluZyBncmFiQXJ0aWNsZSBsb29wXCIpO1xuICAgICAgdmFyIHN0cmlwVW5saWtlbHlDYW5kaWRhdGVzID0gdGhpcy5fZmxhZ0lzQWN0aXZlKHRoaXMuRkxBR19TVFJJUF9VTkxJS0VMWVMpO1xuXG4gICAgICAvLyBGaXJzdCwgbm9kZSBwcmVwcGluZy4gVHJhc2ggbm9kZXMgdGhhdCBsb29rIGNydWRkeSAobGlrZSBvbmVzIHdpdGggdGhlXG4gICAgICAvLyBjbGFzcyBuYW1lIFwiY29tbWVudFwiLCBldGMpLCBhbmQgdHVybiBkaXZzIGludG8gUCB0YWdzIHdoZXJlIHRoZXkgaGF2ZSBiZWVuXG4gICAgICAvLyB1c2VkIGluYXBwcm9wcmlhdGVseSAoYXMgaW4sIHdoZXJlIHRoZXkgY29udGFpbiBubyBvdGhlciBibG9jayBsZXZlbCBlbGVtZW50cy4pXG4gICAgICB2YXIgZWxlbWVudHNUb1Njb3JlID0gW107XG4gICAgICB2YXIgbm9kZSA9IHRoaXMuX2RvYy5kb2N1bWVudEVsZW1lbnQ7XG5cbiAgICAgIGxldCBzaG91bGRSZW1vdmVUaXRsZUhlYWRlciA9IHRydWU7XG5cbiAgICAgIHdoaWxlIChub2RlKSB7XG5cbiAgICAgICAgaWYgKG5vZGUudGFnTmFtZSA9PT0gXCJIVE1MXCIpIHtcbiAgICAgICAgICB0aGlzLl9hcnRpY2xlTGFuZyA9IG5vZGUuZ2V0QXR0cmlidXRlKFwibGFuZ1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBtYXRjaFN0cmluZyA9IG5vZGUuY2xhc3NOYW1lICsgXCIgXCIgKyBub2RlLmlkO1xuXG4gICAgICAgIGlmICghdGhpcy5faXNQcm9iYWJseVZpc2libGUobm9kZSkpIHtcbiAgICAgICAgICB0aGlzLmxvZyhcIlJlbW92aW5nIGhpZGRlbiBub2RlIC0gXCIgKyBtYXRjaFN0cmluZyk7XG4gICAgICAgICAgbm9kZSA9IHRoaXMuX3JlbW92ZUFuZEdldE5leHQobm9kZSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VyIGlzIG5vdCBhYmxlIHRvIHNlZSBlbGVtZW50cyBhcHBsaWVkIHdpdGggYm90aCBcImFyaWEtbW9kYWwgPSB0cnVlXCIgYW5kIFwicm9sZSA9IGRpYWxvZ1wiXG4gICAgICAgIGlmIChub2RlLmdldEF0dHJpYnV0ZShcImFyaWEtbW9kYWxcIikgPT0gXCJ0cnVlXCIgJiYgbm9kZS5nZXRBdHRyaWJ1dGUoXCJyb2xlXCIpID09IFwiZGlhbG9nXCIpIHtcbiAgICAgICAgICBub2RlID0gdGhpcy5fcmVtb3ZlQW5kR2V0TmV4dChub2RlKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGlzIG5vZGUgaXMgYSBieWxpbmUsIGFuZCByZW1vdmUgaXQgaWYgaXQgaXMuXG4gICAgICAgIGlmICh0aGlzLl9jaGVja0J5bGluZShub2RlLCBtYXRjaFN0cmluZykpIHtcbiAgICAgICAgICBub2RlID0gdGhpcy5fcmVtb3ZlQW5kR2V0TmV4dChub2RlKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzaG91bGRSZW1vdmVUaXRsZUhlYWRlciAmJiB0aGlzLl9oZWFkZXJEdXBsaWNhdGVzVGl0bGUobm9kZSkpIHtcbiAgICAgICAgICB0aGlzLmxvZyhcIlJlbW92aW5nIGhlYWRlcjogXCIsIG5vZGUudGV4dENvbnRlbnQudHJpbSgpLCB0aGlzLl9hcnRpY2xlVGl0bGUudHJpbSgpKTtcbiAgICAgICAgICBzaG91bGRSZW1vdmVUaXRsZUhlYWRlciA9IGZhbHNlO1xuICAgICAgICAgIG5vZGUgPSB0aGlzLl9yZW1vdmVBbmRHZXROZXh0KG5vZGUpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHVubGlrZWx5IGNhbmRpZGF0ZXNcbiAgICAgICAgaWYgKHN0cmlwVW5saWtlbHlDYW5kaWRhdGVzKSB7XG4gICAgICAgICAgaWYgKHRoaXMuUkVHRVhQUy51bmxpa2VseUNhbmRpZGF0ZXMudGVzdChtYXRjaFN0cmluZykgJiZcbiAgICAgICAgICAgICAgIXRoaXMuUkVHRVhQUy5va01heWJlSXRzQUNhbmRpZGF0ZS50ZXN0KG1hdGNoU3RyaW5nKSAmJlxuICAgICAgICAgICAgICAhdGhpcy5faGFzQW5jZXN0b3JUYWcobm9kZSwgXCJ0YWJsZVwiKSAmJlxuICAgICAgICAgICAgICAhdGhpcy5faGFzQW5jZXN0b3JUYWcobm9kZSwgXCJjb2RlXCIpICYmXG4gICAgICAgICAgICAgIG5vZGUudGFnTmFtZSAhPT0gXCJCT0RZXCIgJiZcbiAgICAgICAgICAgICAgbm9kZS50YWdOYW1lICE9PSBcIkFcIikge1xuICAgICAgICAgICAgdGhpcy5sb2coXCJSZW1vdmluZyB1bmxpa2VseSBjYW5kaWRhdGUgLSBcIiArIG1hdGNoU3RyaW5nKTtcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLl9yZW1vdmVBbmRHZXROZXh0KG5vZGUpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMuVU5MSUtFTFlfUk9MRVMuaW5jbHVkZXMobm9kZS5nZXRBdHRyaWJ1dGUoXCJyb2xlXCIpKSkge1xuICAgICAgICAgICAgdGhpcy5sb2coXCJSZW1vdmluZyBjb250ZW50IHdpdGggcm9sZSBcIiArIG5vZGUuZ2V0QXR0cmlidXRlKFwicm9sZVwiKSArIFwiIC0gXCIgKyBtYXRjaFN0cmluZyk7XG4gICAgICAgICAgICBub2RlID0gdGhpcy5fcmVtb3ZlQW5kR2V0TmV4dChub2RlKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSBESVYsIFNFQ1RJT04sIGFuZCBIRUFERVIgbm9kZXMgd2l0aG91dCBhbnkgY29udGVudChlLmcuIHRleHQsIGltYWdlLCB2aWRlbywgb3IgaWZyYW1lKS5cbiAgICAgICAgaWYgKChub2RlLnRhZ05hbWUgPT09IFwiRElWXCIgfHwgbm9kZS50YWdOYW1lID09PSBcIlNFQ1RJT05cIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiSEVBREVSXCIgfHxcbiAgICAgICAgICAgICBub2RlLnRhZ05hbWUgPT09IFwiSDFcIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiSDJcIiB8fCBub2RlLnRhZ05hbWUgPT09IFwiSDNcIiB8fFxuICAgICAgICAgICAgIG5vZGUudGFnTmFtZSA9PT0gXCJINFwiIHx8IG5vZGUudGFnTmFtZSA9PT0gXCJINVwiIHx8IG5vZGUudGFnTmFtZSA9PT0gXCJINlwiKSAmJlxuICAgICAgICAgICAgdGhpcy5faXNFbGVtZW50V2l0aG91dENvbnRlbnQobm9kZSkpIHtcbiAgICAgICAgICBub2RlID0gdGhpcy5fcmVtb3ZlQW5kR2V0TmV4dChub2RlKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLkRFRkFVTFRfVEFHU19UT19TQ09SRS5pbmRleE9mKG5vZGUudGFnTmFtZSkgIT09IC0xKSB7XG4gICAgICAgICAgZWxlbWVudHNUb1Njb3JlLnB1c2gobm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUdXJuIGFsbCBkaXZzIHRoYXQgZG9uJ3QgaGF2ZSBjaGlsZHJlbiBibG9jayBsZXZlbCBlbGVtZW50cyBpbnRvIHAnc1xuICAgICAgICBpZiAobm9kZS50YWdOYW1lID09PSBcIkRJVlwiKSB7XG4gICAgICAgICAgLy8gUHV0IHBocmFzaW5nIGNvbnRlbnQgaW50byBwYXJhZ3JhcGhzLlxuICAgICAgICAgIHZhciBwID0gbnVsbDtcbiAgICAgICAgICB2YXIgY2hpbGROb2RlID0gbm9kZS5maXJzdENoaWxkO1xuICAgICAgICAgIHdoaWxlIChjaGlsZE5vZGUpIHtcbiAgICAgICAgICAgIHZhciBuZXh0U2libGluZyA9IGNoaWxkTm9kZS5uZXh0U2libGluZztcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc1BocmFzaW5nQ29udGVudChjaGlsZE5vZGUpKSB7XG4gICAgICAgICAgICAgIGlmIChwICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcC5hcHBlbmRDaGlsZChjaGlsZE5vZGUpO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLl9pc1doaXRlc3BhY2UoY2hpbGROb2RlKSkge1xuICAgICAgICAgICAgICAgIHAgPSBkb2MuY3JlYXRlRWxlbWVudChcInBcIik7XG4gICAgICAgICAgICAgICAgbm9kZS5yZXBsYWNlQ2hpbGQocCwgY2hpbGROb2RlKTtcbiAgICAgICAgICAgICAgICBwLmFwcGVuZENoaWxkKGNoaWxkTm9kZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAocCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICB3aGlsZSAocC5sYXN0Q2hpbGQgJiYgdGhpcy5faXNXaGl0ZXNwYWNlKHAubGFzdENoaWxkKSkge1xuICAgICAgICAgICAgICAgIHAucmVtb3ZlQ2hpbGQocC5sYXN0Q2hpbGQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHAgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2hpbGROb2RlID0gbmV4dFNpYmxpbmc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gU2l0ZXMgbGlrZSBodHRwOi8vbW9iaWxlLnNsYXRlLmNvbSBlbmNsb3NlcyBlYWNoIHBhcmFncmFwaCB3aXRoIGEgRElWXG4gICAgICAgICAgLy8gZWxlbWVudC4gRElWcyB3aXRoIG9ubHkgYSBQIGVsZW1lbnQgaW5zaWRlIGFuZCBubyB0ZXh0IGNvbnRlbnQgY2FuIGJlXG4gICAgICAgICAgLy8gc2FmZWx5IGNvbnZlcnRlZCBpbnRvIHBsYWluIFAgZWxlbWVudHMgdG8gYXZvaWQgY29uZnVzaW5nIHRoZSBzY29yaW5nXG4gICAgICAgICAgLy8gYWxnb3JpdGhtIHdpdGggRElWcyB3aXRoIGFyZSwgaW4gcHJhY3RpY2UsIHBhcmFncmFwaHMuXG4gICAgICAgICAgaWYgKHRoaXMuX2hhc1NpbmdsZVRhZ0luc2lkZUVsZW1lbnQobm9kZSwgXCJQXCIpICYmIHRoaXMuX2dldExpbmtEZW5zaXR5KG5vZGUpIDwgMC4yNSkge1xuICAgICAgICAgICAgdmFyIG5ld05vZGUgPSBub2RlLmNoaWxkcmVuWzBdO1xuICAgICAgICAgICAgbm9kZS5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdOb2RlLCBub2RlKTtcbiAgICAgICAgICAgIG5vZGUgPSBuZXdOb2RlO1xuICAgICAgICAgICAgZWxlbWVudHNUb1Njb3JlLnB1c2gobm9kZSk7XG4gICAgICAgICAgfSBlbHNlIGlmICghdGhpcy5faGFzQ2hpbGRCbG9ja0VsZW1lbnQobm9kZSkpIHtcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLl9zZXROb2RlVGFnKG5vZGUsIFwiUFwiKTtcbiAgICAgICAgICAgIGVsZW1lbnRzVG9TY29yZS5wdXNoKG5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBub2RlID0gdGhpcy5fZ2V0TmV4dE5vZGUobm9kZSk7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogTG9vcCB0aHJvdWdoIGFsbCBwYXJhZ3JhcGhzLCBhbmQgYXNzaWduIGEgc2NvcmUgdG8gdGhlbSBiYXNlZCBvbiBob3cgY29udGVudC15IHRoZXkgbG9vay5cbiAgICAgICAqIFRoZW4gYWRkIHRoZWlyIHNjb3JlIHRvIHRoZWlyIHBhcmVudCBub2RlLlxuICAgICAgICpcbiAgICAgICAqIEEgc2NvcmUgaXMgZGV0ZXJtaW5lZCBieSB0aGluZ3MgbGlrZSBudW1iZXIgb2YgY29tbWFzLCBjbGFzcyBuYW1lcywgZXRjLiBNYXliZSBldmVudHVhbGx5IGxpbmsgZGVuc2l0eS5cbiAgICAgICoqL1xuICAgICAgdmFyIGNhbmRpZGF0ZXMgPSBbXTtcbiAgICAgIHRoaXMuX2ZvckVhY2hOb2RlKGVsZW1lbnRzVG9TY29yZSwgZnVuY3Rpb24oZWxlbWVudFRvU2NvcmUpIHtcbiAgICAgICAgaWYgKCFlbGVtZW50VG9TY29yZS5wYXJlbnROb2RlIHx8IHR5cGVvZihlbGVtZW50VG9TY29yZS5wYXJlbnROb2RlLnRhZ05hbWUpID09PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAvLyBJZiB0aGlzIHBhcmFncmFwaCBpcyBsZXNzIHRoYW4gMjUgY2hhcmFjdGVycywgZG9uJ3QgZXZlbiBjb3VudCBpdC5cbiAgICAgICAgdmFyIGlubmVyVGV4dCA9IHRoaXMuX2dldElubmVyVGV4dChlbGVtZW50VG9TY29yZSk7XG4gICAgICAgIGlmIChpbm5lclRleHQubGVuZ3RoIDwgMjUpXG4gICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIC8vIEV4Y2x1ZGUgbm9kZXMgd2l0aCBubyBhbmNlc3Rvci5cbiAgICAgICAgdmFyIGFuY2VzdG9ycyA9IHRoaXMuX2dldE5vZGVBbmNlc3RvcnMoZWxlbWVudFRvU2NvcmUsIDUpO1xuICAgICAgICBpZiAoYW5jZXN0b3JzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdmFyIGNvbnRlbnRTY29yZSA9IDA7XG5cbiAgICAgICAgLy8gQWRkIGEgcG9pbnQgZm9yIHRoZSBwYXJhZ3JhcGggaXRzZWxmIGFzIGEgYmFzZS5cbiAgICAgICAgY29udGVudFNjb3JlICs9IDE7XG5cbiAgICAgICAgLy8gQWRkIHBvaW50cyBmb3IgYW55IGNvbW1hcyB3aXRoaW4gdGhpcyBwYXJhZ3JhcGguXG4gICAgICAgIGNvbnRlbnRTY29yZSArPSBpbm5lclRleHQuc3BsaXQodGhpcy5SRUdFWFBTLmNvbW1hcykubGVuZ3RoO1xuXG4gICAgICAgIC8vIEZvciBldmVyeSAxMDAgY2hhcmFjdGVycyBpbiB0aGlzIHBhcmFncmFwaCwgYWRkIGFub3RoZXIgcG9pbnQuIFVwIHRvIDMgcG9pbnRzLlxuICAgICAgICBjb250ZW50U2NvcmUgKz0gTWF0aC5taW4oTWF0aC5mbG9vcihpbm5lclRleHQubGVuZ3RoIC8gMTAwKSwgMyk7XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBhbmQgc2NvcmUgYW5jZXN0b3JzLlxuICAgICAgICB0aGlzLl9mb3JFYWNoTm9kZShhbmNlc3RvcnMsIGZ1bmN0aW9uKGFuY2VzdG9yLCBsZXZlbCkge1xuICAgICAgICAgIGlmICghYW5jZXN0b3IudGFnTmFtZSB8fCAhYW5jZXN0b3IucGFyZW50Tm9kZSB8fCB0eXBlb2YoYW5jZXN0b3IucGFyZW50Tm9kZS50YWdOYW1lKSA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgIGlmICh0eXBlb2YoYW5jZXN0b3IucmVhZGFiaWxpdHkpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICB0aGlzLl9pbml0aWFsaXplTm9kZShhbmNlc3Rvcik7XG4gICAgICAgICAgICBjYW5kaWRhdGVzLnB1c2goYW5jZXN0b3IpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIE5vZGUgc2NvcmUgZGl2aWRlcjpcbiAgICAgICAgICAvLyAtIHBhcmVudDogICAgICAgICAgICAgMSAobm8gZGl2aXNpb24pXG4gICAgICAgICAgLy8gLSBncmFuZHBhcmVudDogICAgICAgIDJcbiAgICAgICAgICAvLyAtIGdyZWF0IGdyYW5kcGFyZW50KzogYW5jZXN0b3IgbGV2ZWwgKiAzXG4gICAgICAgICAgaWYgKGxldmVsID09PSAwKVxuICAgICAgICAgICAgdmFyIHNjb3JlRGl2aWRlciA9IDE7XG4gICAgICAgICAgZWxzZSBpZiAobGV2ZWwgPT09IDEpXG4gICAgICAgICAgICBzY29yZURpdmlkZXIgPSAyO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNjb3JlRGl2aWRlciA9IGxldmVsICogMztcbiAgICAgICAgICBhbmNlc3Rvci5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgKz0gY29udGVudFNjb3JlIC8gc2NvcmVEaXZpZGVyO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBBZnRlciB3ZSd2ZSBjYWxjdWxhdGVkIHNjb3JlcywgbG9vcCB0aHJvdWdoIGFsbCBvZiB0aGUgcG9zc2libGVcbiAgICAgIC8vIGNhbmRpZGF0ZSBub2RlcyB3ZSBmb3VuZCBhbmQgZmluZCB0aGUgb25lIHdpdGggdGhlIGhpZ2hlc3Qgc2NvcmUuXG4gICAgICB2YXIgdG9wQ2FuZGlkYXRlcyA9IFtdO1xuICAgICAgZm9yICh2YXIgYyA9IDAsIGNsID0gY2FuZGlkYXRlcy5sZW5ndGg7IGMgPCBjbDsgYyArPSAxKSB7XG4gICAgICAgIHZhciBjYW5kaWRhdGUgPSBjYW5kaWRhdGVzW2NdO1xuXG4gICAgICAgIC8vIFNjYWxlIHRoZSBmaW5hbCBjYW5kaWRhdGVzIHNjb3JlIGJhc2VkIG9uIGxpbmsgZGVuc2l0eS4gR29vZCBjb250ZW50XG4gICAgICAgIC8vIHNob3VsZCBoYXZlIGEgcmVsYXRpdmVseSBzbWFsbCBsaW5rIGRlbnNpdHkgKDUlIG9yIGxlc3MpIGFuZCBiZSBtb3N0bHlcbiAgICAgICAgLy8gdW5hZmZlY3RlZCBieSB0aGlzIG9wZXJhdGlvbi5cbiAgICAgICAgdmFyIGNhbmRpZGF0ZVNjb3JlID0gY2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSAqICgxIC0gdGhpcy5fZ2V0TGlua0RlbnNpdHkoY2FuZGlkYXRlKSk7XG4gICAgICAgIGNhbmRpZGF0ZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgPSBjYW5kaWRhdGVTY29yZTtcblxuICAgICAgICB0aGlzLmxvZyhcIkNhbmRpZGF0ZTpcIiwgY2FuZGlkYXRlLCBcIndpdGggc2NvcmUgXCIgKyBjYW5kaWRhdGVTY29yZSk7XG5cbiAgICAgICAgZm9yICh2YXIgdCA9IDA7IHQgPCB0aGlzLl9uYlRvcENhbmRpZGF0ZXM7IHQrKykge1xuICAgICAgICAgIHZhciBhVG9wQ2FuZGlkYXRlID0gdG9wQ2FuZGlkYXRlc1t0XTtcblxuICAgICAgICAgIGlmICghYVRvcENhbmRpZGF0ZSB8fCBjYW5kaWRhdGVTY29yZSA+IGFUb3BDYW5kaWRhdGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlKSB7XG4gICAgICAgICAgICB0b3BDYW5kaWRhdGVzLnNwbGljZSh0LCAwLCBjYW5kaWRhdGUpO1xuICAgICAgICAgICAgaWYgKHRvcENhbmRpZGF0ZXMubGVuZ3RoID4gdGhpcy5fbmJUb3BDYW5kaWRhdGVzKVxuICAgICAgICAgICAgICB0b3BDYW5kaWRhdGVzLnBvcCgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciB0b3BDYW5kaWRhdGUgPSB0b3BDYW5kaWRhdGVzWzBdIHx8IG51bGw7XG4gICAgICB2YXIgbmVlZGVkVG9DcmVhdGVUb3BDYW5kaWRhdGUgPSBmYWxzZTtcbiAgICAgIHZhciBwYXJlbnRPZlRvcENhbmRpZGF0ZTtcblxuICAgICAgLy8gSWYgd2Ugc3RpbGwgaGF2ZSBubyB0b3AgY2FuZGlkYXRlLCBqdXN0IHVzZSB0aGUgYm9keSBhcyBhIGxhc3QgcmVzb3J0LlxuICAgICAgLy8gV2UgYWxzbyBoYXZlIHRvIGNvcHkgdGhlIGJvZHkgbm9kZSBzbyBpdCBpcyBzb21ldGhpbmcgd2UgY2FuIG1vZGlmeS5cbiAgICAgIGlmICh0b3BDYW5kaWRhdGUgPT09IG51bGwgfHwgdG9wQ2FuZGlkYXRlLnRhZ05hbWUgPT09IFwiQk9EWVwiKSB7XG4gICAgICAgIC8vIE1vdmUgYWxsIG9mIHRoZSBwYWdlJ3MgY2hpbGRyZW4gaW50byB0b3BDYW5kaWRhdGVcbiAgICAgICAgdG9wQ2FuZGlkYXRlID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XG4gICAgICAgIG5lZWRlZFRvQ3JlYXRlVG9wQ2FuZGlkYXRlID0gdHJ1ZTtcbiAgICAgICAgLy8gTW92ZSBldmVyeXRoaW5nIChub3QganVzdCBlbGVtZW50cywgYWxzbyB0ZXh0IG5vZGVzIGV0Yy4pIGludG8gdGhlIGNvbnRhaW5lclxuICAgICAgICAvLyBzbyB3ZSBldmVuIGluY2x1ZGUgdGV4dCBkaXJlY3RseSBpbiB0aGUgYm9keTpcbiAgICAgICAgd2hpbGUgKHBhZ2UuZmlyc3RDaGlsZCkge1xuICAgICAgICAgIHRoaXMubG9nKFwiTW92aW5nIGNoaWxkIG91dDpcIiwgcGFnZS5maXJzdENoaWxkKTtcbiAgICAgICAgICB0b3BDYW5kaWRhdGUuYXBwZW5kQ2hpbGQocGFnZS5maXJzdENoaWxkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhZ2UuYXBwZW5kQ2hpbGQodG9wQ2FuZGlkYXRlKTtcblxuICAgICAgICB0aGlzLl9pbml0aWFsaXplTm9kZSh0b3BDYW5kaWRhdGUpO1xuICAgICAgfSBlbHNlIGlmICh0b3BDYW5kaWRhdGUpIHtcbiAgICAgICAgLy8gRmluZCBhIGJldHRlciB0b3AgY2FuZGlkYXRlIG5vZGUgaWYgaXQgY29udGFpbnMgKGF0IGxlYXN0IHRocmVlKSBub2RlcyB3aGljaCBiZWxvbmcgdG8gYHRvcENhbmRpZGF0ZXNgIGFycmF5XG4gICAgICAgIC8vIGFuZCB3aG9zZSBzY29yZXMgYXJlIHF1aXRlIGNsb3NlZCB3aXRoIGN1cnJlbnQgYHRvcENhbmRpZGF0ZWAgbm9kZS5cbiAgICAgICAgdmFyIGFsdGVybmF0aXZlQ2FuZGlkYXRlQW5jZXN0b3JzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdG9wQ2FuZGlkYXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICh0b3BDYW5kaWRhdGVzW2ldLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSAvIHRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgPj0gMC43NSkge1xuICAgICAgICAgICAgYWx0ZXJuYXRpdmVDYW5kaWRhdGVBbmNlc3RvcnMucHVzaCh0aGlzLl9nZXROb2RlQW5jZXN0b3JzKHRvcENhbmRpZGF0ZXNbaV0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIE1JTklNVU1fVE9QQ0FORElEQVRFUyA9IDM7XG4gICAgICAgIGlmIChhbHRlcm5hdGl2ZUNhbmRpZGF0ZUFuY2VzdG9ycy5sZW5ndGggPj0gTUlOSU1VTV9UT1BDQU5ESURBVEVTKSB7XG4gICAgICAgICAgcGFyZW50T2ZUb3BDYW5kaWRhdGUgPSB0b3BDYW5kaWRhdGUucGFyZW50Tm9kZTtcbiAgICAgICAgICB3aGlsZSAocGFyZW50T2ZUb3BDYW5kaWRhdGUudGFnTmFtZSAhPT0gXCJCT0RZXCIpIHtcbiAgICAgICAgICAgIHZhciBsaXN0c0NvbnRhaW5pbmdUaGlzQW5jZXN0b3IgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgYW5jZXN0b3JJbmRleCA9IDA7IGFuY2VzdG9ySW5kZXggPCBhbHRlcm5hdGl2ZUNhbmRpZGF0ZUFuY2VzdG9ycy5sZW5ndGggJiYgbGlzdHNDb250YWluaW5nVGhpc0FuY2VzdG9yIDwgTUlOSU1VTV9UT1BDQU5ESURBVEVTOyBhbmNlc3RvckluZGV4KyspIHtcbiAgICAgICAgICAgICAgbGlzdHNDb250YWluaW5nVGhpc0FuY2VzdG9yICs9IE51bWJlcihhbHRlcm5hdGl2ZUNhbmRpZGF0ZUFuY2VzdG9yc1thbmNlc3RvckluZGV4XS5pbmNsdWRlcyhwYXJlbnRPZlRvcENhbmRpZGF0ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGxpc3RzQ29udGFpbmluZ1RoaXNBbmNlc3RvciA+PSBNSU5JTVVNX1RPUENBTkRJREFURVMpIHtcbiAgICAgICAgICAgICAgdG9wQ2FuZGlkYXRlID0gcGFyZW50T2ZUb3BDYW5kaWRhdGU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFyZW50T2ZUb3BDYW5kaWRhdGUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZS5wYXJlbnROb2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eSkge1xuICAgICAgICAgIHRoaXMuX2luaXRpYWxpemVOb2RlKHRvcENhbmRpZGF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCZWNhdXNlIG9mIG91ciBib251cyBzeXN0ZW0sIHBhcmVudHMgb2YgY2FuZGlkYXRlcyBtaWdodCBoYXZlIHNjb3Jlc1xuICAgICAgICAvLyB0aGVtc2VsdmVzLiBUaGV5IGdldCBoYWxmIG9mIHRoZSBub2RlLiBUaGVyZSB3b24ndCBiZSBub2RlcyB3aXRoIGhpZ2hlclxuICAgICAgICAvLyBzY29yZXMgdGhhbiBvdXIgdG9wQ2FuZGlkYXRlLCBidXQgaWYgd2Ugc2VlIHRoZSBzY29yZSBnb2luZyAqdXAqIGluIHRoZSBmaXJzdFxuICAgICAgICAvLyBmZXcgc3RlcHMgdXAgdGhlIHRyZWUsIHRoYXQncyBhIGRlY2VudCBzaWduIHRoYXQgdGhlcmUgbWlnaHQgYmUgbW9yZSBjb250ZW50XG4gICAgICAgIC8vIGx1cmtpbmcgaW4gb3RoZXIgcGxhY2VzIHRoYXQgd2Ugd2FudCB0byB1bmlmeSBpbi4gVGhlIHNpYmxpbmcgc3R1ZmZcbiAgICAgICAgLy8gYmVsb3cgZG9lcyBzb21lIG9mIHRoYXQgLSBidXQgb25seSBpZiB3ZSd2ZSBsb29rZWQgaGlnaCBlbm91Z2ggdXAgdGhlIERPTVxuICAgICAgICAvLyB0cmVlLlxuICAgICAgICBwYXJlbnRPZlRvcENhbmRpZGF0ZSA9IHRvcENhbmRpZGF0ZS5wYXJlbnROb2RlO1xuICAgICAgICB2YXIgbGFzdFNjb3JlID0gdG9wQ2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZTtcbiAgICAgICAgLy8gVGhlIHNjb3JlcyBzaG91bGRuJ3QgZ2V0IHRvbyBsb3cuXG4gICAgICAgIHZhciBzY29yZVRocmVzaG9sZCA9IGxhc3RTY29yZSAvIDM7XG4gICAgICAgIHdoaWxlIChwYXJlbnRPZlRvcENhbmRpZGF0ZS50YWdOYW1lICE9PSBcIkJPRFlcIikge1xuICAgICAgICAgIGlmICghcGFyZW50T2ZUb3BDYW5kaWRhdGUucmVhZGFiaWxpdHkpIHtcbiAgICAgICAgICAgIHBhcmVudE9mVG9wQ2FuZGlkYXRlID0gcGFyZW50T2ZUb3BDYW5kaWRhdGUucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcGFyZW50U2NvcmUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmU7XG4gICAgICAgICAgaWYgKHBhcmVudFNjb3JlIDwgc2NvcmVUaHJlc2hvbGQpXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBpZiAocGFyZW50U2NvcmUgPiBsYXN0U2NvcmUpIHtcbiAgICAgICAgICAgIC8vIEFscmlnaHQhIFdlIGZvdW5kIGEgYmV0dGVyIHBhcmVudCB0byB1c2UuXG4gICAgICAgICAgICB0b3BDYW5kaWRhdGUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsYXN0U2NvcmUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZS5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmU7XG4gICAgICAgICAgcGFyZW50T2ZUb3BDYW5kaWRhdGUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZS5wYXJlbnROb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIHRvcCBjYW5kaWRhdGUgaXMgdGhlIG9ubHkgY2hpbGQsIHVzZSBwYXJlbnQgaW5zdGVhZC4gVGhpcyB3aWxsIGhlbHAgc2libGluZ1xuICAgICAgICAvLyBqb2luaW5nIGxvZ2ljIHdoZW4gYWRqYWNlbnQgY29udGVudCBpcyBhY3R1YWxseSBsb2NhdGVkIGluIHBhcmVudCdzIHNpYmxpbmcgbm9kZS5cbiAgICAgICAgcGFyZW50T2ZUb3BDYW5kaWRhdGUgPSB0b3BDYW5kaWRhdGUucGFyZW50Tm9kZTtcbiAgICAgICAgd2hpbGUgKHBhcmVudE9mVG9wQ2FuZGlkYXRlLnRhZ05hbWUgIT0gXCJCT0RZXCIgJiYgcGFyZW50T2ZUb3BDYW5kaWRhdGUuY2hpbGRyZW4ubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICB0b3BDYW5kaWRhdGUgPSBwYXJlbnRPZlRvcENhbmRpZGF0ZTtcbiAgICAgICAgICBwYXJlbnRPZlRvcENhbmRpZGF0ZSA9IHRvcENhbmRpZGF0ZS5wYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdG9wQ2FuZGlkYXRlLnJlYWRhYmlsaXR5KSB7XG4gICAgICAgICAgdGhpcy5faW5pdGlhbGl6ZU5vZGUodG9wQ2FuZGlkYXRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIHRoZSB0b3AgY2FuZGlkYXRlLCBsb29rIHRocm91Z2ggaXRzIHNpYmxpbmdzIGZvciBjb250ZW50XG4gICAgICAvLyB0aGF0IG1pZ2h0IGFsc28gYmUgcmVsYXRlZC4gVGhpbmdzIGxpa2UgcHJlYW1ibGVzLCBjb250ZW50IHNwbGl0IGJ5IGFkc1xuICAgICAgLy8gdGhhdCB3ZSByZW1vdmVkLCBldGMuXG4gICAgICB2YXIgYXJ0aWNsZUNvbnRlbnQgPSBkb2MuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcbiAgICAgIGlmIChpc1BhZ2luZylcbiAgICAgICAgYXJ0aWNsZUNvbnRlbnQuaWQgPSBcInJlYWRhYmlsaXR5LWNvbnRlbnRcIjtcblxuICAgICAgdmFyIHNpYmxpbmdTY29yZVRocmVzaG9sZCA9IE1hdGgubWF4KDEwLCB0b3BDYW5kaWRhdGUucmVhZGFiaWxpdHkuY29udGVudFNjb3JlICogMC4yKTtcbiAgICAgIC8vIEtlZXAgcG90ZW50aWFsIHRvcCBjYW5kaWRhdGUncyBwYXJlbnQgbm9kZSB0byB0cnkgdG8gZ2V0IHRleHQgZGlyZWN0aW9uIG9mIGl0IGxhdGVyLlxuICAgICAgcGFyZW50T2ZUb3BDYW5kaWRhdGUgPSB0b3BDYW5kaWRhdGUucGFyZW50Tm9kZTtcbiAgICAgIHZhciBzaWJsaW5ncyA9IHBhcmVudE9mVG9wQ2FuZGlkYXRlLmNoaWxkcmVuO1xuXG4gICAgICBmb3IgKHZhciBzID0gMCwgc2wgPSBzaWJsaW5ncy5sZW5ndGg7IHMgPCBzbDsgcysrKSB7XG4gICAgICAgIHZhciBzaWJsaW5nID0gc2libGluZ3Nbc107XG4gICAgICAgIHZhciBhcHBlbmQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmxvZyhcIkxvb2tpbmcgYXQgc2libGluZyBub2RlOlwiLCBzaWJsaW5nLCBzaWJsaW5nLnJlYWRhYmlsaXR5ID8gKFwid2l0aCBzY29yZSBcIiArIHNpYmxpbmcucmVhZGFiaWxpdHkuY29udGVudFNjb3JlKSA6IFwiXCIpO1xuICAgICAgICB0aGlzLmxvZyhcIlNpYmxpbmcgaGFzIHNjb3JlXCIsIHNpYmxpbmcucmVhZGFiaWxpdHkgPyBzaWJsaW5nLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSA6IFwiVW5rbm93blwiKTtcblxuICAgICAgICBpZiAoc2libGluZyA9PT0gdG9wQ2FuZGlkYXRlKSB7XG4gICAgICAgICAgYXBwZW5kID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgY29udGVudEJvbnVzID0gMDtcblxuICAgICAgICAgIC8vIEdpdmUgYSBib251cyBpZiBzaWJsaW5nIG5vZGVzIGFuZCB0b3AgY2FuZGlkYXRlcyBoYXZlIHRoZSBleGFtcGxlIHNhbWUgY2xhc3NuYW1lXG4gICAgICAgICAgaWYgKHNpYmxpbmcuY2xhc3NOYW1lID09PSB0b3BDYW5kaWRhdGUuY2xhc3NOYW1lICYmIHRvcENhbmRpZGF0ZS5jbGFzc05hbWUgIT09IFwiXCIpXG4gICAgICAgICAgICBjb250ZW50Qm9udXMgKz0gdG9wQ2FuZGlkYXRlLnJlYWRhYmlsaXR5LmNvbnRlbnRTY29yZSAqIDAuMjtcblxuICAgICAgICAgIGlmIChzaWJsaW5nLnJlYWRhYmlsaXR5ICYmXG4gICAgICAgICAgICAgICgoc2libGluZy5yZWFkYWJpbGl0eS5jb250ZW50U2NvcmUgKyBjb250ZW50Qm9udXMpID49IHNpYmxpbmdTY29yZVRocmVzaG9sZCkpIHtcbiAgICAgICAgICAgIGFwcGVuZCA9IHRydWU7XG4gICAgICAgICAgfSBlbHNlIGlmIChzaWJsaW5nLm5vZGVOYW1lID09PSBcIlBcIikge1xuICAgICAgICAgICAgdmFyIGxpbmtEZW5zaXR5ID0gdGhpcy5fZ2V0TGlua0RlbnNpdHkoc2libGluZyk7XG4gICAgICAgICAgICB2YXIgbm9kZUNvbnRlbnQgPSB0aGlzLl9nZXRJbm5lclRleHQoc2libGluZyk7XG4gICAgICAgICAgICB2YXIgbm9kZUxlbmd0aCA9IG5vZGVDb250ZW50Lmxlbmd0aDtcblxuICAgICAgICAgICAgaWYgKG5vZGVMZW5ndGggPiA4MCAmJiBsaW5rRGVuc2l0eSA8IDAuMjUpIHtcbiAgICAgICAgICAgICAgYXBwZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobm9kZUxlbmd0aCA8IDgwICYmIG5vZGVMZW5ndGggPiAwICYmIGxpbmtEZW5zaXR5ID09PSAwICYmXG4gICAgICAgICAgICAgICAgICAgICAgIG5vZGVDb250ZW50LnNlYXJjaCgvXFwuKCB8JCkvKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgYXBwZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXBwZW5kKSB7XG4gICAgICAgICAgdGhpcy5sb2coXCJBcHBlbmRpbmcgbm9kZTpcIiwgc2libGluZyk7XG5cbiAgICAgICAgICBpZiAodGhpcy5BTFRFUl9UT19ESVZfRVhDRVBUSU9OUy5pbmRleE9mKHNpYmxpbmcubm9kZU5hbWUpID09PSAtMSkge1xuICAgICAgICAgICAgLy8gV2UgaGF2ZSBhIG5vZGUgdGhhdCBpc24ndCBhIGNvbW1vbiBibG9jayBsZXZlbCBlbGVtZW50LCBsaWtlIGEgZm9ybSBvciB0ZCB0YWcuXG4gICAgICAgICAgICAvLyBUdXJuIGl0IGludG8gYSBkaXYgc28gaXQgZG9lc24ndCBnZXQgZmlsdGVyZWQgb3V0IGxhdGVyIGJ5IGFjY2lkZW50LlxuICAgICAgICAgICAgdGhpcy5sb2coXCJBbHRlcmluZyBzaWJsaW5nOlwiLCBzaWJsaW5nLCBcInRvIGRpdi5cIik7XG5cbiAgICAgICAgICAgIHNpYmxpbmcgPSB0aGlzLl9zZXROb2RlVGFnKHNpYmxpbmcsIFwiRElWXCIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGFydGljbGVDb250ZW50LmFwcGVuZENoaWxkKHNpYmxpbmcpO1xuICAgICAgICAgIC8vIEZldGNoIGNoaWxkcmVuIGFnYWluIHRvIG1ha2UgaXQgY29tcGF0aWJsZVxuICAgICAgICAgIC8vIHdpdGggRE9NIHBhcnNlcnMgd2l0aG91dCBsaXZlIGNvbGxlY3Rpb24gc3VwcG9ydC5cbiAgICAgICAgICBzaWJsaW5ncyA9IHBhcmVudE9mVG9wQ2FuZGlkYXRlLmNoaWxkcmVuO1xuICAgICAgICAgIC8vIHNpYmxpbmdzIGlzIGEgcmVmZXJlbmNlIHRvIHRoZSBjaGlsZHJlbiBhcnJheSwgYW5kXG4gICAgICAgICAgLy8gc2libGluZyBpcyByZW1vdmVkIGZyb20gdGhlIGFycmF5IHdoZW4gd2UgY2FsbCBhcHBlbmRDaGlsZCgpLlxuICAgICAgICAgIC8vIEFzIGEgcmVzdWx0LCB3ZSBtdXN0IHJldmlzaXQgdGhpcyBpbmRleCBzaW5jZSB0aGUgbm9kZXNcbiAgICAgICAgICAvLyBoYXZlIGJlZW4gc2hpZnRlZC5cbiAgICAgICAgICBzIC09IDE7XG4gICAgICAgICAgc2wgLT0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fZGVidWcpXG4gICAgICAgIHRoaXMubG9nKFwiQXJ0aWNsZSBjb250ZW50IHByZS1wcmVwOiBcIiArIGFydGljbGVDb250ZW50LmlubmVySFRNTCk7XG4gICAgICAvLyBTbyB3ZSBoYXZlIGFsbCBvZiB0aGUgY29udGVudCB0aGF0IHdlIG5lZWQuIE5vdyB3ZSBjbGVhbiBpdCB1cCBmb3IgcHJlc2VudGF0aW9uLlxuICAgICAgdGhpcy5fcHJlcEFydGljbGUoYXJ0aWNsZUNvbnRlbnQpO1xuICAgICAgaWYgKHRoaXMuX2RlYnVnKVxuICAgICAgICB0aGlzLmxvZyhcIkFydGljbGUgY29udGVudCBwb3N0LXByZXA6IFwiICsgYXJ0aWNsZUNvbnRlbnQuaW5uZXJIVE1MKTtcblxuICAgICAgaWYgKG5lZWRlZFRvQ3JlYXRlVG9wQ2FuZGlkYXRlKSB7XG4gICAgICAgIC8vIFdlIGFscmVhZHkgY3JlYXRlZCBhIGZha2UgZGl2IHRoaW5nLCBhbmQgdGhlcmUgd291bGRuJ3QgaGF2ZSBiZWVuIGFueSBzaWJsaW5ncyBsZWZ0XG4gICAgICAgIC8vIGZvciB0aGUgcHJldmlvdXMgbG9vcCwgc28gdGhlcmUncyBubyBwb2ludCB0cnlpbmcgdG8gY3JlYXRlIGEgbmV3IGRpdiwgYW5kIHRoZW5cbiAgICAgICAgLy8gbW92ZSBhbGwgdGhlIGNoaWxkcmVuIG92ZXIuIEp1c3QgYXNzaWduIElEcyBhbmQgY2xhc3MgbmFtZXMgaGVyZS4gTm8gbmVlZCB0byBhcHBlbmRcbiAgICAgICAgLy8gYmVjYXVzZSB0aGF0IGFscmVhZHkgaGFwcGVuZWQgYW55d2F5LlxuICAgICAgICB0b3BDYW5kaWRhdGUuaWQgPSBcInJlYWRhYmlsaXR5LXBhZ2UtMVwiO1xuICAgICAgICB0b3BDYW5kaWRhdGUuY2xhc3NOYW1lID0gXCJwYWdlXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZGl2ID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XG4gICAgICAgIGRpdi5pZCA9IFwicmVhZGFiaWxpdHktcGFnZS0xXCI7XG4gICAgICAgIGRpdi5jbGFzc05hbWUgPSBcInBhZ2VcIjtcbiAgICAgICAgd2hpbGUgKGFydGljbGVDb250ZW50LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQoYXJ0aWNsZUNvbnRlbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgYXJ0aWNsZUNvbnRlbnQuYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX2RlYnVnKVxuICAgICAgICB0aGlzLmxvZyhcIkFydGljbGUgY29udGVudCBhZnRlciBwYWdpbmc6IFwiICsgYXJ0aWNsZUNvbnRlbnQuaW5uZXJIVE1MKTtcblxuICAgICAgdmFyIHBhcnNlU3VjY2Vzc2Z1bCA9IHRydWU7XG5cbiAgICAgIC8vIE5vdyB0aGF0IHdlJ3ZlIGdvbmUgdGhyb3VnaCB0aGUgZnVsbCBhbGdvcml0aG0sIGNoZWNrIHRvIHNlZSBpZlxuICAgICAgLy8gd2UgZ290IGFueSBtZWFuaW5nZnVsIGNvbnRlbnQuIElmIHdlIGRpZG4ndCwgd2UgbWF5IG5lZWQgdG8gcmUtcnVuXG4gICAgICAvLyBncmFiQXJ0aWNsZSB3aXRoIGRpZmZlcmVudCBmbGFncyBzZXQuIFRoaXMgZ2l2ZXMgdXMgYSBoaWdoZXIgbGlrZWxpaG9vZCBvZlxuICAgICAgLy8gZmluZGluZyB0aGUgY29udGVudCwgYW5kIHRoZSBzaWV2ZSBhcHByb2FjaCBnaXZlcyB1cyBhIGhpZ2hlciBsaWtlbGlob29kIG9mXG4gICAgICAvLyBmaW5kaW5nIHRoZSAtcmlnaHQtIGNvbnRlbnQuXG4gICAgICB2YXIgdGV4dExlbmd0aCA9IHRoaXMuX2dldElubmVyVGV4dChhcnRpY2xlQ29udGVudCwgdHJ1ZSkubGVuZ3RoO1xuICAgICAgaWYgKHRleHRMZW5ndGggPCB0aGlzLl9jaGFyVGhyZXNob2xkKSB7XG4gICAgICAgIHBhcnNlU3VjY2Vzc2Z1bCA9IGZhbHNlO1xuICAgICAgICBwYWdlLmlubmVySFRNTCA9IHBhZ2VDYWNoZUh0bWw7XG5cbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdJc0FjdGl2ZSh0aGlzLkZMQUdfU1RSSVBfVU5MSUtFTFlTKSkge1xuICAgICAgICAgIHRoaXMuX3JlbW92ZUZsYWcodGhpcy5GTEFHX1NUUklQX1VOTElLRUxZUyk7XG4gICAgICAgICAgdGhpcy5fYXR0ZW1wdHMucHVzaCh7YXJ0aWNsZUNvbnRlbnQ6IGFydGljbGVDb250ZW50LCB0ZXh0TGVuZ3RoOiB0ZXh0TGVuZ3RofSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fZmxhZ0lzQWN0aXZlKHRoaXMuRkxBR19XRUlHSFRfQ0xBU1NFUykpIHtcbiAgICAgICAgICB0aGlzLl9yZW1vdmVGbGFnKHRoaXMuRkxBR19XRUlHSFRfQ0xBU1NFUyk7XG4gICAgICAgICAgdGhpcy5fYXR0ZW1wdHMucHVzaCh7YXJ0aWNsZUNvbnRlbnQ6IGFydGljbGVDb250ZW50LCB0ZXh0TGVuZ3RoOiB0ZXh0TGVuZ3RofSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fZmxhZ0lzQWN0aXZlKHRoaXMuRkxBR19DTEVBTl9DT05ESVRJT05BTExZKSkge1xuICAgICAgICAgIHRoaXMuX3JlbW92ZUZsYWcodGhpcy5GTEFHX0NMRUFOX0NPTkRJVElPTkFMTFkpO1xuICAgICAgICAgIHRoaXMuX2F0dGVtcHRzLnB1c2goe2FydGljbGVDb250ZW50OiBhcnRpY2xlQ29udGVudCwgdGV4dExlbmd0aDogdGV4dExlbmd0aH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX2F0dGVtcHRzLnB1c2goe2FydGljbGVDb250ZW50OiBhcnRpY2xlQ29udGVudCwgdGV4dExlbmd0aDogdGV4dExlbmd0aH0pO1xuICAgICAgICAgIC8vIE5vIGx1Y2sgYWZ0ZXIgcmVtb3ZpbmcgZmxhZ3MsIGp1c3QgcmV0dXJuIHRoZSBsb25nZXN0IHRleHQgd2UgZm91bmQgZHVyaW5nIHRoZSBkaWZmZXJlbnQgbG9vcHNcbiAgICAgICAgICB0aGlzLl9hdHRlbXB0cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYi50ZXh0TGVuZ3RoIC0gYS50ZXh0TGVuZ3RoO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gQnV0IGZpcnN0IGNoZWNrIGlmIHdlIGFjdHVhbGx5IGhhdmUgc29tZXRoaW5nXG4gICAgICAgICAgaWYgKCF0aGlzLl9hdHRlbXB0c1swXS50ZXh0TGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhcnRpY2xlQ29udGVudCA9IHRoaXMuX2F0dGVtcHRzWzBdLmFydGljbGVDb250ZW50O1xuICAgICAgICAgIHBhcnNlU3VjY2Vzc2Z1bCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHBhcnNlU3VjY2Vzc2Z1bCkge1xuICAgICAgICAvLyBGaW5kIG91dCB0ZXh0IGRpcmVjdGlvbiBmcm9tIGFuY2VzdG9ycyBvZiBmaW5hbCB0b3AgY2FuZGlkYXRlLlxuICAgICAgICB2YXIgYW5jZXN0b3JzID0gW3BhcmVudE9mVG9wQ2FuZGlkYXRlLCB0b3BDYW5kaWRhdGVdLmNvbmNhdCh0aGlzLl9nZXROb2RlQW5jZXN0b3JzKHBhcmVudE9mVG9wQ2FuZGlkYXRlKSk7XG4gICAgICAgIHRoaXMuX3NvbWVOb2RlKGFuY2VzdG9ycywgZnVuY3Rpb24oYW5jZXN0b3IpIHtcbiAgICAgICAgICBpZiAoIWFuY2VzdG9yLnRhZ05hbWUpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgdmFyIGFydGljbGVEaXIgPSBhbmNlc3Rvci5nZXRBdHRyaWJ1dGUoXCJkaXJcIik7XG4gICAgICAgICAgaWYgKGFydGljbGVEaXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2FydGljbGVEaXIgPSBhcnRpY2xlRGlyO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBhcnRpY2xlQ29udGVudDtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgdGhlIGlucHV0IHN0cmluZyBjb3VsZCBiZSBhIGJ5bGluZS5cbiAgICogVGhpcyB2ZXJpZmllcyB0aGF0IHRoZSBpbnB1dCBpcyBhIHN0cmluZywgYW5kIHRoYXQgdGhlIGxlbmd0aFxuICAgKiBpcyBsZXNzIHRoYW4gMTAwIGNoYXJzLlxuICAgKlxuICAgKiBAcGFyYW0gcG9zc2libGVCeWxpbmUge3N0cmluZ30gLSBhIHN0cmluZyB0byBjaGVjayB3aGV0aGVyIGl0cyBhIGJ5bGluZS5cbiAgICogQHJldHVybiBCb29sZWFuIC0gd2hldGhlciB0aGUgaW5wdXQgc3RyaW5nIGlzIGEgYnlsaW5lLlxuICAgKi9cbiAgX2lzVmFsaWRCeWxpbmU6IGZ1bmN0aW9uKGJ5bGluZSkge1xuICAgIGlmICh0eXBlb2YgYnlsaW5lID09IFwic3RyaW5nXCIgfHwgYnlsaW5lIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICBieWxpbmUgPSBieWxpbmUudHJpbSgpO1xuICAgICAgcmV0dXJuIChieWxpbmUubGVuZ3RoID4gMCkgJiYgKGJ5bGluZS5sZW5ndGggPCAxMDApO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHNvbWUgb2YgdGhlIGNvbW1vbiBIVE1MIGVudGl0aWVzIGluIHN0cmluZyB0byB0aGVpciBjb3JyZXNwb25kaW5nIGNoYXJhY3RlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBzdHIge3N0cmluZ30gLSBhIHN0cmluZyB0byB1bmVzY2FwZS5cbiAgICogQHJldHVybiBzdHJpbmcgd2l0aG91dCBIVE1MIGVudGl0eS5cbiAgICovXG4gIF91bmVzY2FwZUh0bWxFbnRpdGllczogZnVuY3Rpb24oc3RyKSB7XG4gICAgaWYgKCFzdHIpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuXG4gICAgdmFyIGh0bWxFc2NhcGVNYXAgPSB0aGlzLkhUTUxfRVNDQVBFX01BUDtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyYocXVvdHxhbXB8YXBvc3xsdHxndCk7L2csIGZ1bmN0aW9uKF8sIHRhZykge1xuICAgICAgcmV0dXJuIGh0bWxFc2NhcGVNYXBbdGFnXTtcbiAgICB9KS5yZXBsYWNlKC8mIyg/OngoWzAtOWEtel17MSw0fSl8KFswLTldezEsNH0pKTsvZ2ksIGZ1bmN0aW9uKF8sIGhleCwgbnVtU3RyKSB7XG4gICAgICB2YXIgbnVtID0gcGFyc2VJbnQoaGV4IHx8IG51bVN0ciwgaGV4ID8gMTYgOiAxMCk7XG4gICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShudW0pO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBUcnkgdG8gZXh0cmFjdCBtZXRhZGF0YSBmcm9tIEpTT04tTEQgb2JqZWN0LlxuICAgKiBGb3Igbm93LCBvbmx5IFNjaGVtYS5vcmcgb2JqZWN0cyBvZiB0eXBlIEFydGljbGUgb3IgaXRzIHN1YnR5cGVzIGFyZSBzdXBwb3J0ZWQuXG4gICAqIEByZXR1cm4gT2JqZWN0IHdpdGggYW55IG1ldGFkYXRhIHRoYXQgY291bGQgYmUgZXh0cmFjdGVkIChwb3NzaWJseSBub25lKVxuICAgKi9cbiAgX2dldEpTT05MRDogZnVuY3Rpb24gKGRvYykge1xuICAgIHZhciBzY3JpcHRzID0gdGhpcy5fZ2V0QWxsTm9kZXNXaXRoVGFnKGRvYywgW1wic2NyaXB0XCJdKTtcblxuICAgIHZhciBtZXRhZGF0YTtcblxuICAgIHRoaXMuX2ZvckVhY2hOb2RlKHNjcmlwdHMsIGZ1bmN0aW9uKGpzb25MZEVsZW1lbnQpIHtcbiAgICAgIGlmICghbWV0YWRhdGEgJiYganNvbkxkRWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpID09PSBcImFwcGxpY2F0aW9uL2xkK2pzb25cIikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIFN0cmlwIENEQVRBIG1hcmtlcnMgaWYgcHJlc2VudFxuICAgICAgICAgIHZhciBjb250ZW50ID0ganNvbkxkRWxlbWVudC50ZXh0Q29udGVudC5yZXBsYWNlKC9eXFxzKjwhXFxbQ0RBVEFcXFt8XFxdXFxdPlxccyokL2csIFwiXCIpO1xuICAgICAgICAgIHZhciBwYXJzZWQgPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICFwYXJzZWRbXCJAY29udGV4dFwiXSB8fFxuICAgICAgICAgICAgIXBhcnNlZFtcIkBjb250ZXh0XCJdLm1hdGNoKC9eaHR0cHM/XFw6XFwvXFwvc2NoZW1hXFwub3JnJC8pXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFwYXJzZWRbXCJAdHlwZVwiXSAmJiBBcnJheS5pc0FycmF5KHBhcnNlZFtcIkBncmFwaFwiXSkpIHtcbiAgICAgICAgICAgIHBhcnNlZCA9IHBhcnNlZFtcIkBncmFwaFwiXS5maW5kKGZ1bmN0aW9uKGl0KSB7XG4gICAgICAgICAgICAgIHJldHVybiAoaXRbXCJAdHlwZVwiXSB8fCBcIlwiKS5tYXRjaChcbiAgICAgICAgICAgICAgICB0aGlzLlJFR0VYUFMuanNvbkxkQXJ0aWNsZVR5cGVzXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAhcGFyc2VkIHx8XG4gICAgICAgICAgICAhcGFyc2VkW1wiQHR5cGVcIl0gfHxcbiAgICAgICAgICAgICFwYXJzZWRbXCJAdHlwZVwiXS5tYXRjaCh0aGlzLlJFR0VYUFMuanNvbkxkQXJ0aWNsZVR5cGVzKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG1ldGFkYXRhID0ge307XG5cbiAgICAgICAgICBpZiAodHlwZW9mIHBhcnNlZC5uYW1lID09PSBcInN0cmluZ1wiICYmIHR5cGVvZiBwYXJzZWQuaGVhZGxpbmUgPT09IFwic3RyaW5nXCIgJiYgcGFyc2VkLm5hbWUgIT09IHBhcnNlZC5oZWFkbGluZSkge1xuICAgICAgICAgICAgLy8gd2UgaGF2ZSBib3RoIG5hbWUgYW5kIGhlYWRsaW5lIGVsZW1lbnQgaW4gdGhlIEpTT04tTEQuIFRoZXkgc2hvdWxkIGJvdGggYmUgdGhlIHNhbWUgYnV0IHNvbWUgd2Vic2l0ZXMgbGlrZSBha3R1YWxuZS5jelxuICAgICAgICAgICAgLy8gcHV0IHRoZWlyIG93biBuYW1lIGludG8gXCJuYW1lXCIgYW5kIHRoZSBhcnRpY2xlIHRpdGxlIHRvIFwiaGVhZGxpbmVcIiB3aGljaCBjb25mdXNlcyBSZWFkYWJpbGl0eS4gU28gd2UgdHJ5IHRvIGNoZWNrIGlmIGVpdGhlclxuICAgICAgICAgICAgLy8gXCJuYW1lXCIgb3IgXCJoZWFkbGluZVwiIGNsb3NlbHkgbWF0Y2hlcyB0aGUgaHRtbCB0aXRsZSwgYW5kIGlmIHNvLCB1c2UgdGhhdCBvbmUuIElmIG5vdCwgdGhlbiB3ZSB1c2UgXCJuYW1lXCIgYnkgZGVmYXVsdC5cblxuICAgICAgICAgICAgdmFyIHRpdGxlID0gdGhpcy5fZ2V0QXJ0aWNsZVRpdGxlKCk7XG4gICAgICAgICAgICB2YXIgbmFtZU1hdGNoZXMgPSB0aGlzLl90ZXh0U2ltaWxhcml0eShwYXJzZWQubmFtZSwgdGl0bGUpID4gMC43NTtcbiAgICAgICAgICAgIHZhciBoZWFkbGluZU1hdGNoZXMgPSB0aGlzLl90ZXh0U2ltaWxhcml0eShwYXJzZWQuaGVhZGxpbmUsIHRpdGxlKSA+IDAuNzU7XG5cbiAgICAgICAgICAgIGlmIChoZWFkbGluZU1hdGNoZXMgJiYgIW5hbWVNYXRjaGVzKSB7XG4gICAgICAgICAgICAgIG1ldGFkYXRhLnRpdGxlID0gcGFyc2VkLmhlYWRsaW5lO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbWV0YWRhdGEudGl0bGUgPSBwYXJzZWQubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBwYXJzZWQubmFtZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgbWV0YWRhdGEudGl0bGUgPSBwYXJzZWQubmFtZS50cmltKCk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcGFyc2VkLmhlYWRsaW5lID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBtZXRhZGF0YS50aXRsZSA9IHBhcnNlZC5oZWFkbGluZS50cmltKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChwYXJzZWQuYXV0aG9yKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcnNlZC5hdXRob3IubmFtZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICBtZXRhZGF0YS5ieWxpbmUgPSBwYXJzZWQuYXV0aG9yLm5hbWUudHJpbSgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHBhcnNlZC5hdXRob3IpICYmIHBhcnNlZC5hdXRob3JbMF0gJiYgdHlwZW9mIHBhcnNlZC5hdXRob3JbMF0ubmFtZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICBtZXRhZGF0YS5ieWxpbmUgPSBwYXJzZWQuYXV0aG9yXG4gICAgICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbihhdXRob3IpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBhdXRob3IgJiYgdHlwZW9mIGF1dGhvci5uYW1lID09PSBcInN0cmluZ1wiO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbihhdXRob3IpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBhdXRob3IubmFtZS50cmltKCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuam9pbihcIiwgXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodHlwZW9mIHBhcnNlZC5kZXNjcmlwdGlvbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgbWV0YWRhdGEuZXhjZXJwdCA9IHBhcnNlZC5kZXNjcmlwdGlvbi50cmltKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHBhcnNlZC5wdWJsaXNoZXIgJiZcbiAgICAgICAgICAgIHR5cGVvZiBwYXJzZWQucHVibGlzaGVyLm5hbWUgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIG1ldGFkYXRhLnNpdGVOYW1lID0gcGFyc2VkLnB1Ymxpc2hlci5uYW1lLnRyaW0oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGVvZiBwYXJzZWQuZGF0ZVB1Ymxpc2hlZCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgbWV0YWRhdGEuZGF0ZVB1Ymxpc2hlZCA9IHBhcnNlZC5kYXRlUHVibGlzaGVkLnRyaW0oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICB0aGlzLmxvZyhlcnIubWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbWV0YWRhdGEgPyBtZXRhZGF0YSA6IHt9O1xuICB9LFxuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byBnZXQgZXhjZXJwdCBhbmQgYnlsaW5lIG1ldGFkYXRhIGZvciB0aGUgYXJ0aWNsZS5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGpzb25sZCDigJQgb2JqZWN0IGNvbnRhaW5pbmcgYW55IG1ldGFkYXRhIHRoYXRcbiAgICogY291bGQgYmUgZXh0cmFjdGVkIGZyb20gSlNPTi1MRCBvYmplY3QuXG4gICAqXG4gICAqIEByZXR1cm4gT2JqZWN0IHdpdGggb3B0aW9uYWwgXCJleGNlcnB0XCIgYW5kIFwiYnlsaW5lXCIgcHJvcGVydGllc1xuICAgKi9cbiAgX2dldEFydGljbGVNZXRhZGF0YTogZnVuY3Rpb24oanNvbmxkKSB7XG4gICAgdmFyIG1ldGFkYXRhID0ge307XG4gICAgdmFyIHZhbHVlcyA9IHt9O1xuICAgIHZhciBtZXRhRWxlbWVudHMgPSB0aGlzLl9kb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJtZXRhXCIpO1xuXG4gICAgLy8gcHJvcGVydHkgaXMgYSBzcGFjZS1zZXBhcmF0ZWQgbGlzdCBvZiB2YWx1ZXNcbiAgICB2YXIgcHJvcGVydHlQYXR0ZXJuID0gL1xccyooYXJ0aWNsZXxkY3xkY3Rlcm18b2d8dHdpdHRlcilcXHMqOlxccyooYXV0aG9yfGNyZWF0b3J8ZGVzY3JpcHRpb258cHVibGlzaGVkX3RpbWV8dGl0bGV8c2l0ZV9uYW1lKVxccyovZ2k7XG5cbiAgICAvLyBuYW1lIGlzIGEgc2luZ2xlIHZhbHVlXG4gICAgdmFyIG5hbWVQYXR0ZXJuID0gL15cXHMqKD86KGRjfGRjdGVybXxvZ3x0d2l0dGVyfHdlaWJvOihhcnRpY2xlfHdlYnBhZ2UpKVxccypbXFwuOl1cXHMqKT8oYXV0aG9yfGNyZWF0b3J8ZGVzY3JpcHRpb258dGl0bGV8c2l0ZV9uYW1lKVxccyokL2k7XG5cbiAgICAvLyBGaW5kIGRlc2NyaXB0aW9uIHRhZ3MuXG4gICAgdGhpcy5fZm9yRWFjaE5vZGUobWV0YUVsZW1lbnRzLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICB2YXIgZWxlbWVudE5hbWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShcIm5hbWVcIik7XG4gICAgICB2YXIgZWxlbWVudFByb3BlcnR5ID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJwcm9wZXJ0eVwiKTtcbiAgICAgIHZhciBjb250ZW50ID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJjb250ZW50XCIpO1xuICAgICAgaWYgKCFjb250ZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBtYXRjaGVzID0gbnVsbDtcbiAgICAgIHZhciBuYW1lID0gbnVsbDtcblxuICAgICAgaWYgKGVsZW1lbnRQcm9wZXJ0eSkge1xuICAgICAgICBtYXRjaGVzID0gZWxlbWVudFByb3BlcnR5Lm1hdGNoKHByb3BlcnR5UGF0dGVybik7XG4gICAgICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgICAgLy8gQ29udmVydCB0byBsb3dlcmNhc2UsIGFuZCByZW1vdmUgYW55IHdoaXRlc3BhY2VcbiAgICAgICAgICAvLyBzbyB3ZSBjYW4gbWF0Y2ggYmVsb3cuXG4gICAgICAgICAgbmFtZSA9IG1hdGNoZXNbMF0udG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMvZywgXCJcIik7XG4gICAgICAgICAgLy8gbXVsdGlwbGUgYXV0aG9yc1xuICAgICAgICAgIHZhbHVlc1tuYW1lXSA9IGNvbnRlbnQudHJpbSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIW1hdGNoZXMgJiYgZWxlbWVudE5hbWUgJiYgbmFtZVBhdHRlcm4udGVzdChlbGVtZW50TmFtZSkpIHtcbiAgICAgICAgbmFtZSA9IGVsZW1lbnROYW1lO1xuICAgICAgICBpZiAoY29udGVudCkge1xuICAgICAgICAgIC8vIENvbnZlcnQgdG8gbG93ZXJjYXNlLCByZW1vdmUgYW55IHdoaXRlc3BhY2UsIGFuZCBjb252ZXJ0IGRvdHNcbiAgICAgICAgICAvLyB0byBjb2xvbnMgc28gd2UgY2FuIG1hdGNoIGJlbG93LlxuICAgICAgICAgIG5hbWUgPSBuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzL2csIFwiXCIpLnJlcGxhY2UoL1xcLi9nLCBcIjpcIik7XG4gICAgICAgICAgdmFsdWVzW25hbWVdID0gY29udGVudC50cmltKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIGdldCB0aXRsZVxuICAgIG1ldGFkYXRhLnRpdGxlID0ganNvbmxkLnRpdGxlIHx8XG4gICAgICAgICAgICAgICAgICAgICB2YWx1ZXNbXCJkYzp0aXRsZVwiXSB8fFxuICAgICAgICAgICAgICAgICAgICAgdmFsdWVzW1wiZGN0ZXJtOnRpdGxlXCJdIHx8XG4gICAgICAgICAgICAgICAgICAgICB2YWx1ZXNbXCJvZzp0aXRsZVwiXSB8fFxuICAgICAgICAgICAgICAgICAgICAgdmFsdWVzW1wid2VpYm86YXJ0aWNsZTp0aXRsZVwiXSB8fFxuICAgICAgICAgICAgICAgICAgICAgdmFsdWVzW1wid2VpYm86d2VicGFnZTp0aXRsZVwiXSB8fFxuICAgICAgICAgICAgICAgICAgICAgdmFsdWVzW1widGl0bGVcIl0gfHxcbiAgICAgICAgICAgICAgICAgICAgIHZhbHVlc1tcInR3aXR0ZXI6dGl0bGVcIl07XG5cbiAgICBpZiAoIW1ldGFkYXRhLnRpdGxlKSB7XG4gICAgICBtZXRhZGF0YS50aXRsZSA9IHRoaXMuX2dldEFydGljbGVUaXRsZSgpO1xuICAgIH1cblxuICAgIC8vIGdldCBhdXRob3JcbiAgICBtZXRhZGF0YS5ieWxpbmUgPSBqc29ubGQuYnlsaW5lIHx8XG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWVzW1wiZGM6Y3JlYXRvclwiXSB8fFxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlc1tcImRjdGVybTpjcmVhdG9yXCJdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWVzW1wiYXV0aG9yXCJdO1xuXG4gICAgLy8gZ2V0IGRlc2NyaXB0aW9uXG4gICAgbWV0YWRhdGEuZXhjZXJwdCA9IGpzb25sZC5leGNlcnB0IHx8XG4gICAgICAgICAgICAgICAgICAgICAgIHZhbHVlc1tcImRjOmRlc2NyaXB0aW9uXCJdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIHZhbHVlc1tcImRjdGVybTpkZXNjcmlwdGlvblwiXSB8fFxuICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXNbXCJvZzpkZXNjcmlwdGlvblwiXSB8fFxuICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXNbXCJ3ZWlibzphcnRpY2xlOmRlc2NyaXB0aW9uXCJdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIHZhbHVlc1tcIndlaWJvOndlYnBhZ2U6ZGVzY3JpcHRpb25cIl0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzW1wiZGVzY3JpcHRpb25cIl0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzW1widHdpdHRlcjpkZXNjcmlwdGlvblwiXTtcblxuICAgIC8vIGdldCBzaXRlIG5hbWVcbiAgICBtZXRhZGF0YS5zaXRlTmFtZSA9IGpzb25sZC5zaXRlTmFtZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzW1wib2c6c2l0ZV9uYW1lXCJdO1xuXG4gICAgLy8gZ2V0IGFydGljbGUgcHVibGlzaGVkIHRpbWVcbiAgICBtZXRhZGF0YS5wdWJsaXNoZWRUaW1lID0ganNvbmxkLmRhdGVQdWJsaXNoZWQgfHxcbiAgICAgIHZhbHVlc1tcImFydGljbGU6cHVibGlzaGVkX3RpbWVcIl0gfHwgbnVsbDtcblxuICAgIC8vIGluIG1hbnkgc2l0ZXMgdGhlIG1ldGEgdmFsdWUgaXMgZXNjYXBlZCB3aXRoIEhUTUwgZW50aXRpZXMsXG4gICAgLy8gc28gaGVyZSB3ZSBuZWVkIHRvIHVuZXNjYXBlIGl0XG4gICAgbWV0YWRhdGEudGl0bGUgPSB0aGlzLl91bmVzY2FwZUh0bWxFbnRpdGllcyhtZXRhZGF0YS50aXRsZSk7XG4gICAgbWV0YWRhdGEuYnlsaW5lID0gdGhpcy5fdW5lc2NhcGVIdG1sRW50aXRpZXMobWV0YWRhdGEuYnlsaW5lKTtcbiAgICBtZXRhZGF0YS5leGNlcnB0ID0gdGhpcy5fdW5lc2NhcGVIdG1sRW50aXRpZXMobWV0YWRhdGEuZXhjZXJwdCk7XG4gICAgbWV0YWRhdGEuc2l0ZU5hbWUgPSB0aGlzLl91bmVzY2FwZUh0bWxFbnRpdGllcyhtZXRhZGF0YS5zaXRlTmFtZSk7XG4gICAgbWV0YWRhdGEucHVibGlzaGVkVGltZSA9IHRoaXMuX3VuZXNjYXBlSHRtbEVudGl0aWVzKG1ldGFkYXRhLnB1Ymxpc2hlZFRpbWUpO1xuXG4gICAgcmV0dXJuIG1ldGFkYXRhO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBub2RlIGlzIGltYWdlLCBvciBpZiBub2RlIGNvbnRhaW5zIGV4YWN0bHkgb25seSBvbmUgaW1hZ2VcbiAgICogd2hldGhlciBhcyBhIGRpcmVjdCBjaGlsZCBvciBhcyBpdHMgZGVzY2VuZGFudHMuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICoqL1xuICBfaXNTaW5nbGVJbWFnZTogZnVuY3Rpb24obm9kZSkge1xuICAgIGlmIChub2RlLnRhZ05hbWUgPT09IFwiSU1HXCIpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChub2RlLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fCBub2RlLnRleHRDb250ZW50LnRyaW0oKSAhPT0gXCJcIikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9pc1NpbmdsZUltYWdlKG5vZGUuY2hpbGRyZW5bMF0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBGaW5kIGFsbCA8bm9zY3JpcHQ+IHRoYXQgYXJlIGxvY2F0ZWQgYWZ0ZXIgPGltZz4gbm9kZXMsIGFuZCB3aGljaCBjb250YWluIG9ubHkgb25lXG4gICAqIDxpbWc+IGVsZW1lbnQuIFJlcGxhY2UgdGhlIGZpcnN0IGltYWdlIHdpdGggdGhlIGltYWdlIGZyb20gaW5zaWRlIHRoZSA8bm9zY3JpcHQ+IHRhZyxcbiAgICogYW5kIHJlbW92ZSB0aGUgPG5vc2NyaXB0PiB0YWcuIFRoaXMgaW1wcm92ZXMgdGhlIHF1YWxpdHkgb2YgdGhlIGltYWdlcyB3ZSB1c2Ugb25cbiAgICogc29tZSBzaXRlcyAoZS5nLiBNZWRpdW0pLlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAqKi9cbiAgX3Vud3JhcE5vc2NyaXB0SW1hZ2VzOiBmdW5jdGlvbihkb2MpIHtcbiAgICAvLyBGaW5kIGltZyB3aXRob3V0IHNvdXJjZSBvciBhdHRyaWJ1dGVzIHRoYXQgbWlnaHQgY29udGFpbnMgaW1hZ2UsIGFuZCByZW1vdmUgaXQuXG4gICAgLy8gVGhpcyBpcyBkb25lIHRvIHByZXZlbnQgYSBwbGFjZWhvbGRlciBpbWcgaXMgcmVwbGFjZWQgYnkgaW1nIGZyb20gbm9zY3JpcHQgaW4gbmV4dCBzdGVwLlxuICAgIHZhciBpbWdzID0gQXJyYXkuZnJvbShkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbWdcIikpO1xuICAgIHRoaXMuX2ZvckVhY2hOb2RlKGltZ3MsIGZ1bmN0aW9uKGltZykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbWcuYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgYXR0ciA9IGltZy5hdHRyaWJ1dGVzW2ldO1xuICAgICAgICBzd2l0Y2ggKGF0dHIubmFtZSkge1xuICAgICAgICAgIGNhc2UgXCJzcmNcIjpcbiAgICAgICAgICBjYXNlIFwic3Jjc2V0XCI6XG4gICAgICAgICAgY2FzZSBcImRhdGEtc3JjXCI6XG4gICAgICAgICAgY2FzZSBcImRhdGEtc3Jjc2V0XCI6XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoL1xcLihqcGd8anBlZ3xwbmd8d2VicCkvaS50ZXN0KGF0dHIudmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGltZy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGltZyk7XG4gICAgfSk7XG5cbiAgICAvLyBOZXh0IGZpbmQgbm9zY3JpcHQgYW5kIHRyeSB0byBleHRyYWN0IGl0cyBpbWFnZVxuICAgIHZhciBub3NjcmlwdHMgPSBBcnJheS5mcm9tKGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZShcIm5vc2NyaXB0XCIpKTtcbiAgICB0aGlzLl9mb3JFYWNoTm9kZShub3NjcmlwdHMsIGZ1bmN0aW9uKG5vc2NyaXB0KSB7XG4gICAgICAvLyBQYXJzZSBjb250ZW50IG9mIG5vc2NyaXB0IGFuZCBtYWtlIHN1cmUgaXQgb25seSBjb250YWlucyBpbWFnZVxuICAgICAgdmFyIHRtcCA9IGRvYy5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgdG1wLmlubmVySFRNTCA9IG5vc2NyaXB0LmlubmVySFRNTDtcbiAgICAgIGlmICghdGhpcy5faXNTaW5nbGVJbWFnZSh0bXApKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm9zY3JpcHQgaGFzIHByZXZpb3VzIHNpYmxpbmcgYW5kIGl0IG9ubHkgY29udGFpbnMgaW1hZ2UsXG4gICAgICAvLyByZXBsYWNlIGl0IHdpdGggbm9zY3JpcHQgY29udGVudC4gSG93ZXZlciB3ZSBhbHNvIGtlZXAgb2xkXG4gICAgICAvLyBhdHRyaWJ1dGVzIHRoYXQgbWlnaHQgY29udGFpbnMgaW1hZ2UuXG4gICAgICB2YXIgcHJldkVsZW1lbnQgPSBub3NjcmlwdC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nO1xuICAgICAgaWYgKHByZXZFbGVtZW50ICYmIHRoaXMuX2lzU2luZ2xlSW1hZ2UocHJldkVsZW1lbnQpKSB7XG4gICAgICAgIHZhciBwcmV2SW1nID0gcHJldkVsZW1lbnQ7XG4gICAgICAgIGlmIChwcmV2SW1nLnRhZ05hbWUgIT09IFwiSU1HXCIpIHtcbiAgICAgICAgICBwcmV2SW1nID0gcHJldkVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbWdcIilbMF07XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbmV3SW1nID0gdG1wLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW1nXCIpWzBdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByZXZJbWcuYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBhdHRyID0gcHJldkltZy5hdHRyaWJ1dGVzW2ldO1xuICAgICAgICAgIGlmIChhdHRyLnZhbHVlID09PSBcIlwiKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYXR0ci5uYW1lID09PSBcInNyY1wiIHx8IGF0dHIubmFtZSA9PT0gXCJzcmNzZXRcIiB8fCAvXFwuKGpwZ3xqcGVnfHBuZ3x3ZWJwKS9pLnRlc3QoYXR0ci52YWx1ZSkpIHtcbiAgICAgICAgICAgIGlmIChuZXdJbWcuZ2V0QXR0cmlidXRlKGF0dHIubmFtZSkgPT09IGF0dHIudmFsdWUpIHtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBhdHRyTmFtZSA9IGF0dHIubmFtZTtcbiAgICAgICAgICAgIGlmIChuZXdJbWcuaGFzQXR0cmlidXRlKGF0dHJOYW1lKSkge1xuICAgICAgICAgICAgICBhdHRyTmFtZSA9IFwiZGF0YS1vbGQtXCIgKyBhdHRyTmFtZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbmV3SW1nLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgYXR0ci52YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbm9zY3JpcHQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQodG1wLmZpcnN0RWxlbWVudENoaWxkLCBwcmV2RWxlbWVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgc2NyaXB0IHRhZ3MgZnJvbSB0aGUgZG9jdW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICoqL1xuICBfcmVtb3ZlU2NyaXB0czogZnVuY3Rpb24oZG9jKSB7XG4gICAgdGhpcy5fcmVtb3ZlTm9kZXModGhpcy5fZ2V0QWxsTm9kZXNXaXRoVGFnKGRvYywgW1wic2NyaXB0XCIsIFwibm9zY3JpcHRcIl0pKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhpcyBub2RlIGhhcyBvbmx5IHdoaXRlc3BhY2UgYW5kIGEgc2luZ2xlIGVsZW1lbnQgd2l0aCBnaXZlbiB0YWdcbiAgICogUmV0dXJucyBmYWxzZSBpZiB0aGUgRElWIG5vZGUgY29udGFpbnMgbm9uLWVtcHR5IHRleHQgbm9kZXNcbiAgICogb3IgaWYgaXQgY29udGFpbnMgbm8gZWxlbWVudCB3aXRoIGdpdmVuIHRhZyBvciBtb3JlIHRoYW4gMSBlbGVtZW50LlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKiBAcGFyYW0gc3RyaW5nIHRhZyBvZiBjaGlsZCBlbGVtZW50XG4gICoqL1xuICBfaGFzU2luZ2xlVGFnSW5zaWRlRWxlbWVudDogZnVuY3Rpb24oZWxlbWVudCwgdGFnKSB7XG4gICAgLy8gVGhlcmUgc2hvdWxkIGJlIGV4YWN0bHkgMSBlbGVtZW50IGNoaWxkIHdpdGggZ2l2ZW4gdGFnXG4gICAgaWYgKGVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoICE9IDEgfHwgZWxlbWVudC5jaGlsZHJlblswXS50YWdOYW1lICE9PSB0YWcpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBBbmQgdGhlcmUgc2hvdWxkIGJlIG5vIHRleHQgbm9kZXMgd2l0aCByZWFsIGNvbnRlbnRcbiAgICByZXR1cm4gIXRoaXMuX3NvbWVOb2RlKGVsZW1lbnQuY2hpbGROb2RlcywgZnVuY3Rpb24obm9kZSkge1xuICAgICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IHRoaXMuVEVYVF9OT0RFICYmXG4gICAgICAgICAgICAgdGhpcy5SRUdFWFBTLmhhc0NvbnRlbnQudGVzdChub2RlLnRleHRDb250ZW50KTtcbiAgICB9KTtcbiAgfSxcblxuICBfaXNFbGVtZW50V2l0aG91dENvbnRlbnQ6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gdGhpcy5FTEVNRU5UX05PREUgJiZcbiAgICAgIG5vZGUudGV4dENvbnRlbnQudHJpbSgpLmxlbmd0aCA9PSAwICYmXG4gICAgICAobm9kZS5jaGlsZHJlbi5sZW5ndGggPT0gMCB8fFxuICAgICAgIG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJiclwiKS5sZW5ndGggKyBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaHJcIikubGVuZ3RoKTtcbiAgfSxcblxuICAvKipcbiAgICogRGV0ZXJtaW5lIHdoZXRoZXIgZWxlbWVudCBoYXMgYW55IGNoaWxkcmVuIGJsb2NrIGxldmVsIGVsZW1lbnRzLlxuICAgKlxuICAgKiBAcGFyYW0gRWxlbWVudFxuICAgKi9cbiAgX2hhc0NoaWxkQmxvY2tFbGVtZW50OiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgIHJldHVybiB0aGlzLl9zb21lTm9kZShlbGVtZW50LmNoaWxkTm9kZXMsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHJldHVybiB0aGlzLkRJVl9UT19QX0VMRU1TLmhhcyhub2RlLnRhZ05hbWUpIHx8XG4gICAgICAgICAgICAgdGhpcy5faGFzQ2hpbGRCbG9ja0VsZW1lbnQobm9kZSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqKlxuICAgKiBEZXRlcm1pbmUgaWYgYSBub2RlIHF1YWxpZmllcyBhcyBwaHJhc2luZyBjb250ZW50LlxuICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9HdWlkZS9IVE1ML0NvbnRlbnRfY2F0ZWdvcmllcyNQaHJhc2luZ19jb250ZW50XG4gICoqL1xuICBfaXNQaHJhc2luZ0NvbnRlbnQ6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gdGhpcy5URVhUX05PREUgfHwgdGhpcy5QSFJBU0lOR19FTEVNUy5pbmRleE9mKG5vZGUudGFnTmFtZSkgIT09IC0xIHx8XG4gICAgICAoKG5vZGUudGFnTmFtZSA9PT0gXCJBXCIgfHwgbm9kZS50YWdOYW1lID09PSBcIkRFTFwiIHx8IG5vZGUudGFnTmFtZSA9PT0gXCJJTlNcIikgJiZcbiAgICAgICAgdGhpcy5fZXZlcnlOb2RlKG5vZGUuY2hpbGROb2RlcywgdGhpcy5faXNQaHJhc2luZ0NvbnRlbnQpKTtcbiAgfSxcblxuICBfaXNXaGl0ZXNwYWNlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgcmV0dXJuIChub2RlLm5vZGVUeXBlID09PSB0aGlzLlRFWFRfTk9ERSAmJiBub2RlLnRleHRDb250ZW50LnRyaW0oKS5sZW5ndGggPT09IDApIHx8XG4gICAgICAgICAgIChub2RlLm5vZGVUeXBlID09PSB0aGlzLkVMRU1FTlRfTk9ERSAmJiBub2RlLnRhZ05hbWUgPT09IFwiQlJcIik7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCB0aGUgaW5uZXIgdGV4dCBvZiBhIG5vZGUgLSBjcm9zcyBicm93c2VyIGNvbXBhdGlibHkuXG4gICAqIFRoaXMgYWxzbyBzdHJpcHMgb3V0IGFueSBleGNlc3Mgd2hpdGVzcGFjZSB0byBiZSBmb3VuZC5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHBhcmFtIEJvb2xlYW4gbm9ybWFsaXplU3BhY2VzIChkZWZhdWx0OiB0cnVlKVxuICAgKiBAcmV0dXJuIHN0cmluZ1xuICAqKi9cbiAgX2dldElubmVyVGV4dDogZnVuY3Rpb24oZSwgbm9ybWFsaXplU3BhY2VzKSB7XG4gICAgbm9ybWFsaXplU3BhY2VzID0gKHR5cGVvZiBub3JtYWxpemVTcGFjZXMgPT09IFwidW5kZWZpbmVkXCIpID8gdHJ1ZSA6IG5vcm1hbGl6ZVNwYWNlcztcbiAgICB2YXIgdGV4dENvbnRlbnQgPSBlLnRleHRDb250ZW50LnRyaW0oKTtcblxuICAgIGlmIChub3JtYWxpemVTcGFjZXMpIHtcbiAgICAgIHJldHVybiB0ZXh0Q29udGVudC5yZXBsYWNlKHRoaXMuUkVHRVhQUy5ub3JtYWxpemUsIFwiIFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRleHRDb250ZW50O1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG51bWJlciBvZiB0aW1lcyBhIHN0cmluZyBzIGFwcGVhcnMgaW4gdGhlIG5vZGUgZS5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHBhcmFtIHN0cmluZyAtIHdoYXQgdG8gc3BsaXQgb24uIERlZmF1bHQgaXMgXCIsXCJcbiAgICogQHJldHVybiBudW1iZXIgKGludGVnZXIpXG4gICoqL1xuICBfZ2V0Q2hhckNvdW50OiBmdW5jdGlvbihlLCBzKSB7XG4gICAgcyA9IHMgfHwgXCIsXCI7XG4gICAgcmV0dXJuIHRoaXMuX2dldElubmVyVGV4dChlKS5zcGxpdChzKS5sZW5ndGggLSAxO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhlIHN0eWxlIGF0dHJpYnV0ZSBvbiBldmVyeSBlIGFuZCB1bmRlci5cbiAgICogVE9ETzogVGVzdCBpZiBnZXRFbGVtZW50c0J5VGFnTmFtZSgqKSBpcyBmYXN0ZXIuXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEByZXR1cm4gdm9pZFxuICAqKi9cbiAgX2NsZWFuU3R5bGVzOiBmdW5jdGlvbihlKSB7XG4gICAgaWYgKCFlIHx8IGUudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcInN2Z1wiKVxuICAgICAgcmV0dXJuO1xuXG4gICAgLy8gUmVtb3ZlIGBzdHlsZWAgYW5kIGRlcHJlY2F0ZWQgcHJlc2VudGF0aW9uYWwgYXR0cmlidXRlc1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5QUkVTRU5UQVRJT05BTF9BVFRSSUJVVEVTLmxlbmd0aDsgaSsrKSB7XG4gICAgICBlLnJlbW92ZUF0dHJpYnV0ZSh0aGlzLlBSRVNFTlRBVElPTkFMX0FUVFJJQlVURVNbaV0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLkRFUFJFQ0FURURfU0laRV9BVFRSSUJVVEVfRUxFTVMuaW5kZXhPZihlLnRhZ05hbWUpICE9PSAtMSkge1xuICAgICAgZS5yZW1vdmVBdHRyaWJ1dGUoXCJ3aWR0aFwiKTtcbiAgICAgIGUucmVtb3ZlQXR0cmlidXRlKFwiaGVpZ2h0XCIpO1xuICAgIH1cblxuICAgIHZhciBjdXIgPSBlLmZpcnN0RWxlbWVudENoaWxkO1xuICAgIHdoaWxlIChjdXIgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuX2NsZWFuU3R5bGVzKGN1cik7XG4gICAgICBjdXIgPSBjdXIubmV4dEVsZW1lbnRTaWJsaW5nO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogR2V0IHRoZSBkZW5zaXR5IG9mIGxpbmtzIGFzIGEgcGVyY2VudGFnZSBvZiB0aGUgY29udGVudFxuICAgKiBUaGlzIGlzIHRoZSBhbW91bnQgb2YgdGV4dCB0aGF0IGlzIGluc2lkZSBhIGxpbmsgZGl2aWRlZCBieSB0aGUgdG90YWwgdGV4dCBpbiB0aGUgbm9kZS5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHJldHVybiBudW1iZXIgKGZsb2F0KVxuICAqKi9cbiAgX2dldExpbmtEZW5zaXR5OiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgdmFyIHRleHRMZW5ndGggPSB0aGlzLl9nZXRJbm5lclRleHQoZWxlbWVudCkubGVuZ3RoO1xuICAgIGlmICh0ZXh0TGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIDA7XG5cbiAgICB2YXIgbGlua0xlbmd0aCA9IDA7XG5cbiAgICAvLyBYWFggaW1wbGVtZW50IF9yZWR1Y2VOb2RlTGlzdD9cbiAgICB0aGlzLl9mb3JFYWNoTm9kZShlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYVwiKSwgZnVuY3Rpb24obGlua05vZGUpIHtcbiAgICAgIHZhciBocmVmID0gbGlua05vZGUuZ2V0QXR0cmlidXRlKFwiaHJlZlwiKTtcbiAgICAgIHZhciBjb2VmZmljaWVudCA9IGhyZWYgJiYgdGhpcy5SRUdFWFBTLmhhc2hVcmwudGVzdChocmVmKSA/IDAuMyA6IDE7XG4gICAgICBsaW5rTGVuZ3RoICs9IHRoaXMuX2dldElubmVyVGV4dChsaW5rTm9kZSkubGVuZ3RoICogY29lZmZpY2llbnQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGlua0xlbmd0aCAvIHRleHRMZW5ndGg7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBhbiBlbGVtZW50cyBjbGFzcy9pZCB3ZWlnaHQuIFVzZXMgcmVndWxhciBleHByZXNzaW9ucyB0byB0ZWxsIGlmIHRoaXNcbiAgICogZWxlbWVudCBsb29rcyBnb29kIG9yIGJhZC5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHJldHVybiBudW1iZXIgKEludGVnZXIpXG4gICoqL1xuICBfZ2V0Q2xhc3NXZWlnaHQ6IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoIXRoaXMuX2ZsYWdJc0FjdGl2ZSh0aGlzLkZMQUdfV0VJR0hUX0NMQVNTRVMpKVxuICAgICAgcmV0dXJuIDA7XG5cbiAgICB2YXIgd2VpZ2h0ID0gMDtcblxuICAgIC8vIExvb2sgZm9yIGEgc3BlY2lhbCBjbGFzc25hbWVcbiAgICBpZiAodHlwZW9mKGUuY2xhc3NOYW1lKSA9PT0gXCJzdHJpbmdcIiAmJiBlLmNsYXNzTmFtZSAhPT0gXCJcIikge1xuICAgICAgaWYgKHRoaXMuUkVHRVhQUy5uZWdhdGl2ZS50ZXN0KGUuY2xhc3NOYW1lKSlcbiAgICAgICAgd2VpZ2h0IC09IDI1O1xuXG4gICAgICBpZiAodGhpcy5SRUdFWFBTLnBvc2l0aXZlLnRlc3QoZS5jbGFzc05hbWUpKVxuICAgICAgICB3ZWlnaHQgKz0gMjU7XG4gICAgfVxuXG4gICAgLy8gTG9vayBmb3IgYSBzcGVjaWFsIElEXG4gICAgaWYgKHR5cGVvZihlLmlkKSA9PT0gXCJzdHJpbmdcIiAmJiBlLmlkICE9PSBcIlwiKSB7XG4gICAgICBpZiAodGhpcy5SRUdFWFBTLm5lZ2F0aXZlLnRlc3QoZS5pZCkpXG4gICAgICAgIHdlaWdodCAtPSAyNTtcblxuICAgICAgaWYgKHRoaXMuUkVHRVhQUy5wb3NpdGl2ZS50ZXN0KGUuaWQpKVxuICAgICAgICB3ZWlnaHQgKz0gMjU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHdlaWdodDtcbiAgfSxcblxuICAvKipcbiAgICogQ2xlYW4gYSBub2RlIG9mIGFsbCBlbGVtZW50cyBvZiB0eXBlIFwidGFnXCIuXG4gICAqIChVbmxlc3MgaXQncyBhIHlvdXR1YmUvdmltZW8gdmlkZW8uIFBlb3BsZSBsb3ZlIG1vdmllcy4pXG4gICAqXG4gICAqIEBwYXJhbSBFbGVtZW50XG4gICAqIEBwYXJhbSBzdHJpbmcgdGFnIHRvIGNsZWFuXG4gICAqIEByZXR1cm4gdm9pZFxuICAgKiovXG4gIF9jbGVhbjogZnVuY3Rpb24oZSwgdGFnKSB7XG4gICAgdmFyIGlzRW1iZWQgPSBbXCJvYmplY3RcIiwgXCJlbWJlZFwiLCBcImlmcmFtZVwiXS5pbmRleE9mKHRhZykgIT09IC0xO1xuXG4gICAgdGhpcy5fcmVtb3ZlTm9kZXModGhpcy5fZ2V0QWxsTm9kZXNXaXRoVGFnKGUsIFt0YWddKSwgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgLy8gQWxsb3cgeW91dHViZSBhbmQgdmltZW8gdmlkZW9zIHRocm91Z2ggYXMgcGVvcGxlIHVzdWFsbHkgd2FudCB0byBzZWUgdGhvc2UuXG4gICAgICBpZiAoaXNFbWJlZCkge1xuICAgICAgICAvLyBGaXJzdCwgY2hlY2sgdGhlIGVsZW1lbnRzIGF0dHJpYnV0ZXMgdG8gc2VlIGlmIGFueSBvZiB0aGVtIGNvbnRhaW4geW91dHViZSBvciB2aW1lb1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnQuYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICh0aGlzLl9hbGxvd2VkVmlkZW9SZWdleC50ZXN0KGVsZW1lbnQuYXR0cmlidXRlc1tpXS52YWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGb3IgZW1iZWQgd2l0aCA8b2JqZWN0PiB0YWcsIGNoZWNrIGlubmVyIEhUTUwgYXMgd2VsbC5cbiAgICAgICAgaWYgKGVsZW1lbnQudGFnTmFtZSA9PT0gXCJvYmplY3RcIiAmJiB0aGlzLl9hbGxvd2VkVmlkZW9SZWdleC50ZXN0KGVsZW1lbnQuaW5uZXJIVE1MKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSBnaXZlbiBub2RlIGhhcyBvbmUgb2YgaXRzIGFuY2VzdG9yIHRhZyBuYW1lIG1hdGNoaW5nIHRoZVxuICAgKiBwcm92aWRlZCBvbmUuXG4gICAqIEBwYXJhbSAgSFRNTEVsZW1lbnQgbm9kZVxuICAgKiBAcGFyYW0gIFN0cmluZyAgICAgIHRhZ05hbWVcbiAgICogQHBhcmFtICBOdW1iZXIgICAgICBtYXhEZXB0aFxuICAgKiBAcGFyYW0gIEZ1bmN0aW9uICAgIGZpbHRlckZuIGEgZmlsdGVyIHRvIGludm9rZSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIG5vZGUgJ2NvdW50cydcbiAgICogQHJldHVybiBCb29sZWFuXG4gICAqL1xuICBfaGFzQW5jZXN0b3JUYWc6IGZ1bmN0aW9uKG5vZGUsIHRhZ05hbWUsIG1heERlcHRoLCBmaWx0ZXJGbikge1xuICAgIG1heERlcHRoID0gbWF4RGVwdGggfHwgMztcbiAgICB0YWdOYW1lID0gdGFnTmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgIHZhciBkZXB0aCA9IDA7XG4gICAgd2hpbGUgKG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgaWYgKG1heERlcHRoID4gMCAmJiBkZXB0aCA+IG1heERlcHRoKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAobm9kZS5wYXJlbnROb2RlLnRhZ05hbWUgPT09IHRhZ05hbWUgJiYgKCFmaWx0ZXJGbiB8fCBmaWx0ZXJGbihub2RlLnBhcmVudE5vZGUpKSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgZGVwdGgrKztcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYW4gb2JqZWN0IGluZGljYXRpbmcgaG93IG1hbnkgcm93cyBhbmQgY29sdW1ucyB0aGlzIHRhYmxlIGhhcy5cbiAgICovXG4gIF9nZXRSb3dBbmRDb2x1bW5Db3VudDogZnVuY3Rpb24odGFibGUpIHtcbiAgICB2YXIgcm93cyA9IDA7XG4gICAgdmFyIGNvbHVtbnMgPSAwO1xuICAgIHZhciB0cnMgPSB0YWJsZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRyXCIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcm93c3BhbiA9IHRyc1tpXS5nZXRBdHRyaWJ1dGUoXCJyb3dzcGFuXCIpIHx8IDA7XG4gICAgICBpZiAocm93c3Bhbikge1xuICAgICAgICByb3dzcGFuID0gcGFyc2VJbnQocm93c3BhbiwgMTApO1xuICAgICAgfVxuICAgICAgcm93cyArPSAocm93c3BhbiB8fCAxKTtcblxuICAgICAgLy8gTm93IGxvb2sgZm9yIGNvbHVtbi1yZWxhdGVkIGluZm9cbiAgICAgIHZhciBjb2x1bW5zSW5UaGlzUm93ID0gMDtcbiAgICAgIHZhciBjZWxscyA9IHRyc1tpXS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRkXCIpO1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjZWxscy5sZW5ndGg7IGorKykge1xuICAgICAgICB2YXIgY29sc3BhbiA9IGNlbGxzW2pdLmdldEF0dHJpYnV0ZShcImNvbHNwYW5cIikgfHwgMDtcbiAgICAgICAgaWYgKGNvbHNwYW4pIHtcbiAgICAgICAgICBjb2xzcGFuID0gcGFyc2VJbnQoY29sc3BhbiwgMTApO1xuICAgICAgICB9XG4gICAgICAgIGNvbHVtbnNJblRoaXNSb3cgKz0gKGNvbHNwYW4gfHwgMSk7XG4gICAgICB9XG4gICAgICBjb2x1bW5zID0gTWF0aC5tYXgoY29sdW1ucywgY29sdW1uc0luVGhpc1Jvdyk7XG4gICAgfVxuICAgIHJldHVybiB7cm93czogcm93cywgY29sdW1uczogY29sdW1uc307XG4gIH0sXG5cbiAgLyoqXG4gICAqIExvb2sgZm9yICdkYXRhJyAoYXMgb3Bwb3NlZCB0byAnbGF5b3V0JykgdGFibGVzLCBmb3Igd2hpY2ggd2UgdXNlXG4gICAqIHNpbWlsYXIgY2hlY2tzIGFzXG4gICAqIGh0dHBzOi8vc2VhcmNoZm94Lm9yZy9tb3ppbGxhLWNlbnRyYWwvcmV2L2Y4MmQ1YzU0OWYwNDZjYjY0Y2U1NjAyYmZkODk0YjdhZTgwN2M4ZjgvYWNjZXNzaWJsZS9nZW5lcmljL1RhYmxlQWNjZXNzaWJsZS5jcHAjMTlcbiAgICovXG4gIF9tYXJrRGF0YVRhYmxlczogZnVuY3Rpb24ocm9vdCkge1xuICAgIHZhciB0YWJsZXMgPSByb290LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidGFibGVcIik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0YWJsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB0YWJsZSA9IHRhYmxlc1tpXTtcbiAgICAgIHZhciByb2xlID0gdGFibGUuZ2V0QXR0cmlidXRlKFwicm9sZVwiKTtcbiAgICAgIGlmIChyb2xlID09IFwicHJlc2VudGF0aW9uXCIpIHtcbiAgICAgICAgdGFibGUuX3JlYWRhYmlsaXR5RGF0YVRhYmxlID0gZmFsc2U7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdmFyIGRhdGF0YWJsZSA9IHRhYmxlLmdldEF0dHJpYnV0ZShcImRhdGF0YWJsZVwiKTtcbiAgICAgIGlmIChkYXRhdGFibGUgPT0gXCIwXCIpIHtcbiAgICAgICAgdGFibGUuX3JlYWRhYmlsaXR5RGF0YVRhYmxlID0gZmFsc2U7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdmFyIHN1bW1hcnkgPSB0YWJsZS5nZXRBdHRyaWJ1dGUoXCJzdW1tYXJ5XCIpO1xuICAgICAgaWYgKHN1bW1hcnkpIHtcbiAgICAgICAgdGFibGUuX3JlYWRhYmlsaXR5RGF0YVRhYmxlID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHZhciBjYXB0aW9uID0gdGFibGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYXB0aW9uXCIpWzBdO1xuICAgICAgaWYgKGNhcHRpb24gJiYgY2FwdGlvbi5jaGlsZE5vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGFibGUuX3JlYWRhYmlsaXR5RGF0YVRhYmxlID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoZSB0YWJsZSBoYXMgYSBkZXNjZW5kYW50IHdpdGggYW55IG9mIHRoZXNlIHRhZ3MsIGNvbnNpZGVyIGEgZGF0YSB0YWJsZTpcbiAgICAgIHZhciBkYXRhVGFibGVEZXNjZW5kYW50cyA9IFtcImNvbFwiLCBcImNvbGdyb3VwXCIsIFwidGZvb3RcIiwgXCJ0aGVhZFwiLCBcInRoXCJdO1xuICAgICAgdmFyIGRlc2NlbmRhbnRFeGlzdHMgPSBmdW5jdGlvbih0YWcpIHtcbiAgICAgICAgcmV0dXJuICEhdGFibGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnKVswXTtcbiAgICAgIH07XG4gICAgICBpZiAoZGF0YVRhYmxlRGVzY2VuZGFudHMuc29tZShkZXNjZW5kYW50RXhpc3RzKSkge1xuICAgICAgICB0aGlzLmxvZyhcIkRhdGEgdGFibGUgYmVjYXVzZSBmb3VuZCBkYXRhLXkgZGVzY2VuZGFudFwiKTtcbiAgICAgICAgdGFibGUuX3JlYWRhYmlsaXR5RGF0YVRhYmxlID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIE5lc3RlZCB0YWJsZXMgaW5kaWNhdGUgYSBsYXlvdXQgdGFibGU6XG4gICAgICBpZiAodGFibGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ0YWJsZVwiKVswXSkge1xuICAgICAgICB0YWJsZS5fcmVhZGFiaWxpdHlEYXRhVGFibGUgPSBmYWxzZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHZhciBzaXplSW5mbyA9IHRoaXMuX2dldFJvd0FuZENvbHVtbkNvdW50KHRhYmxlKTtcbiAgICAgIGlmIChzaXplSW5mby5yb3dzID49IDEwIHx8IHNpemVJbmZvLmNvbHVtbnMgPiA0KSB7XG4gICAgICAgIHRhYmxlLl9yZWFkYWJpbGl0eURhdGFUYWJsZSA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLy8gTm93IGp1c3QgZ28gYnkgc2l6ZSBlbnRpcmVseTpcbiAgICAgIHRhYmxlLl9yZWFkYWJpbGl0eURhdGFUYWJsZSA9IHNpemVJbmZvLnJvd3MgKiBzaXplSW5mby5jb2x1bW5zID4gMTA7XG4gICAgfVxuICB9LFxuXG4gIC8qIGNvbnZlcnQgaW1hZ2VzIGFuZCBmaWd1cmVzIHRoYXQgaGF2ZSBwcm9wZXJ0aWVzIGxpa2UgZGF0YS1zcmMgaW50byBpbWFnZXMgdGhhdCBjYW4gYmUgbG9hZGVkIHdpdGhvdXQgSlMgKi9cbiAgX2ZpeExhenlJbWFnZXM6IGZ1bmN0aW9uIChyb290KSB7XG4gICAgdGhpcy5fZm9yRWFjaE5vZGUodGhpcy5fZ2V0QWxsTm9kZXNXaXRoVGFnKHJvb3QsIFtcImltZ1wiLCBcInBpY3R1cmVcIiwgXCJmaWd1cmVcIl0pLCBmdW5jdGlvbiAoZWxlbSkge1xuICAgICAgLy8gSW4gc29tZSBzaXRlcyAoZS5nLiBLb3Rha3UpLCB0aGV5IHB1dCAxcHggc3F1YXJlIGltYWdlIGFzIGJhc2U2NCBkYXRhIHVyaSBpbiB0aGUgc3JjIGF0dHJpYnV0ZS5cbiAgICAgIC8vIFNvLCBoZXJlIHdlIGNoZWNrIGlmIHRoZSBkYXRhIHVyaSBpcyB0b28gc2hvcnQsIGp1c3QgbWlnaHQgYXMgd2VsbCByZW1vdmUgaXQuXG4gICAgICBpZiAoZWxlbS5zcmMgJiYgdGhpcy5SRUdFWFBTLmI2NERhdGFVcmwudGVzdChlbGVtLnNyYykpIHtcbiAgICAgICAgLy8gTWFrZSBzdXJlIGl0J3Mgbm90IFNWRywgYmVjYXVzZSBTVkcgY2FuIGhhdmUgYSBtZWFuaW5nZnVsIGltYWdlIGluIHVuZGVyIDEzMyBieXRlcy5cbiAgICAgICAgdmFyIHBhcnRzID0gdGhpcy5SRUdFWFBTLmI2NERhdGFVcmwuZXhlYyhlbGVtLnNyYyk7XG4gICAgICAgIGlmIChwYXJ0c1sxXSA9PT0gXCJpbWFnZS9zdmcreG1sXCIpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNYWtlIHN1cmUgdGhpcyBlbGVtZW50IGhhcyBvdGhlciBhdHRyaWJ1dGVzIHdoaWNoIGNvbnRhaW5zIGltYWdlLlxuICAgICAgICAvLyBJZiBpdCBkb2Vzbid0LCB0aGVuIHRoaXMgc3JjIGlzIGltcG9ydGFudCBhbmQgc2hvdWxkbid0IGJlIHJlbW92ZWQuXG4gICAgICAgIHZhciBzcmNDb3VsZEJlUmVtb3ZlZCA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW0uYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBhdHRyID0gZWxlbS5hdHRyaWJ1dGVzW2ldO1xuICAgICAgICAgIGlmIChhdHRyLm5hbWUgPT09IFwic3JjXCIpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICgvXFwuKGpwZ3xqcGVnfHBuZ3x3ZWJwKS9pLnRlc3QoYXR0ci52YWx1ZSkpIHtcbiAgICAgICAgICAgIHNyY0NvdWxkQmVSZW1vdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhlcmUgd2UgYXNzdW1lIGlmIGltYWdlIGlzIGxlc3MgdGhhbiAxMDAgYnl0ZXMgKG9yIDEzM0IgYWZ0ZXIgZW5jb2RlZCB0byBiYXNlNjQpXG4gICAgICAgIC8vIGl0IHdpbGwgYmUgdG9vIHNtYWxsLCB0aGVyZWZvcmUgaXQgbWlnaHQgYmUgcGxhY2Vob2xkZXIgaW1hZ2UuXG4gICAgICAgIGlmIChzcmNDb3VsZEJlUmVtb3ZlZCkge1xuICAgICAgICAgIHZhciBiNjRzdGFydHMgPSBlbGVtLnNyYy5zZWFyY2goL2Jhc2U2NFxccyovaSkgKyA3O1xuICAgICAgICAgIHZhciBiNjRsZW5ndGggPSBlbGVtLnNyYy5sZW5ndGggLSBiNjRzdGFydHM7XG4gICAgICAgICAgaWYgKGI2NGxlbmd0aCA8IDEzMykge1xuICAgICAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoXCJzcmNcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGFsc28gY2hlY2sgZm9yIFwibnVsbFwiIHRvIHdvcmsgYXJvdW5kIGh0dHBzOi8vZ2l0aHViLmNvbS9qc2RvbS9qc2RvbS9pc3N1ZXMvMjU4MFxuICAgICAgaWYgKChlbGVtLnNyYyB8fCAoZWxlbS5zcmNzZXQgJiYgZWxlbS5zcmNzZXQgIT0gXCJudWxsXCIpKSAmJiBlbGVtLmNsYXNzTmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoXCJsYXp5XCIpID09PSAtMSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZWxlbS5hdHRyaWJ1dGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGF0dHIgPSBlbGVtLmF0dHJpYnV0ZXNbal07XG4gICAgICAgIGlmIChhdHRyLm5hbWUgPT09IFwic3JjXCIgfHwgYXR0ci5uYW1lID09PSBcInNyY3NldFwiIHx8IGF0dHIubmFtZSA9PT0gXCJhbHRcIikge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjb3B5VG8gPSBudWxsO1xuICAgICAgICBpZiAoL1xcLihqcGd8anBlZ3xwbmd8d2VicClcXHMrXFxkLy50ZXN0KGF0dHIudmFsdWUpKSB7XG4gICAgICAgICAgY29weVRvID0gXCJzcmNzZXRcIjtcbiAgICAgICAgfSBlbHNlIGlmICgvXlxccypcXFMrXFwuKGpwZ3xqcGVnfHBuZ3x3ZWJwKVxcUypcXHMqJC8udGVzdChhdHRyLnZhbHVlKSkge1xuICAgICAgICAgIGNvcHlUbyA9IFwic3JjXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvcHlUbykge1xuICAgICAgICAgIC8vaWYgdGhpcyBpcyBhbiBpbWcgb3IgcGljdHVyZSwgc2V0IHRoZSBhdHRyaWJ1dGUgZGlyZWN0bHlcbiAgICAgICAgICBpZiAoZWxlbS50YWdOYW1lID09PSBcIklNR1wiIHx8IGVsZW0udGFnTmFtZSA9PT0gXCJQSUNUVVJFXCIpIHtcbiAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKGNvcHlUbywgYXR0ci52YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChlbGVtLnRhZ05hbWUgPT09IFwiRklHVVJFXCIgJiYgIXRoaXMuX2dldEFsbE5vZGVzV2l0aFRhZyhlbGVtLCBbXCJpbWdcIiwgXCJwaWN0dXJlXCJdKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vaWYgdGhlIGl0ZW0gaXMgYSA8ZmlndXJlPiB0aGF0IGRvZXMgbm90IGNvbnRhaW4gYW4gaW1hZ2Ugb3IgcGljdHVyZSwgY3JlYXRlIG9uZSBhbmQgcGxhY2UgaXQgaW5zaWRlIHRoZSBmaWd1cmVcbiAgICAgICAgICAgIC8vc2VlIHRoZSBueXRpbWVzLTMgdGVzdGNhc2UgZm9yIGFuIGV4YW1wbGVcbiAgICAgICAgICAgIHZhciBpbWcgPSB0aGlzLl9kb2MuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcbiAgICAgICAgICAgIGltZy5zZXRBdHRyaWJ1dGUoY29weVRvLCBhdHRyLnZhbHVlKTtcbiAgICAgICAgICAgIGVsZW0uYXBwZW5kQ2hpbGQoaW1nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICBfZ2V0VGV4dERlbnNpdHk6IGZ1bmN0aW9uKGUsIHRhZ3MpIHtcbiAgICB2YXIgdGV4dExlbmd0aCA9IHRoaXMuX2dldElubmVyVGV4dChlLCB0cnVlKS5sZW5ndGg7XG4gICAgaWYgKHRleHRMZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICB2YXIgY2hpbGRyZW5MZW5ndGggPSAwO1xuICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuX2dldEFsbE5vZGVzV2l0aFRhZyhlLCB0YWdzKTtcbiAgICB0aGlzLl9mb3JFYWNoTm9kZShjaGlsZHJlbiwgKGNoaWxkKSA9PiBjaGlsZHJlbkxlbmd0aCArPSB0aGlzLl9nZXRJbm5lclRleHQoY2hpbGQsIHRydWUpLmxlbmd0aCk7XG4gICAgcmV0dXJuIGNoaWxkcmVuTGVuZ3RoIC8gdGV4dExlbmd0aDtcbiAgfSxcblxuICAvKipcbiAgICogQ2xlYW4gYW4gZWxlbWVudCBvZiBhbGwgdGFncyBvZiB0eXBlIFwidGFnXCIgaWYgdGhleSBsb29rIGZpc2h5LlxuICAgKiBcIkZpc2h5XCIgaXMgYW4gYWxnb3JpdGhtIGJhc2VkIG9uIGNvbnRlbnQgbGVuZ3RoLCBjbGFzc25hbWVzLCBsaW5rIGRlbnNpdHksIG51bWJlciBvZiBpbWFnZXMgJiBlbWJlZHMsIGV0Yy5cbiAgICpcbiAgICogQHJldHVybiB2b2lkXG4gICAqKi9cbiAgX2NsZWFuQ29uZGl0aW9uYWxseTogZnVuY3Rpb24oZSwgdGFnKSB7XG4gICAgaWYgKCF0aGlzLl9mbGFnSXNBY3RpdmUodGhpcy5GTEFHX0NMRUFOX0NPTkRJVElPTkFMTFkpKVxuICAgICAgcmV0dXJuO1xuXG4gICAgLy8gR2F0aGVyIGNvdW50cyBmb3Igb3RoZXIgdHlwaWNhbCBlbGVtZW50cyBlbWJlZGRlZCB3aXRoaW4uXG4gICAgLy8gVHJhdmVyc2UgYmFja3dhcmRzIHNvIHdlIGNhbiByZW1vdmUgbm9kZXMgYXQgdGhlIHNhbWUgdGltZVxuICAgIC8vIHdpdGhvdXQgZWZmZWN0aW5nIHRoZSB0cmF2ZXJzYWwuXG4gICAgLy9cbiAgICAvLyBUT0RPOiBDb25zaWRlciB0YWtpbmcgaW50byBhY2NvdW50IG9yaWdpbmFsIGNvbnRlbnRTY29yZSBoZXJlLlxuICAgIHRoaXMuX3JlbW92ZU5vZGVzKHRoaXMuX2dldEFsbE5vZGVzV2l0aFRhZyhlLCBbdGFnXSksIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIC8vIEZpcnN0IGNoZWNrIGlmIHRoaXMgbm9kZSBJUyBkYXRhIHRhYmxlLCBpbiB3aGljaCBjYXNlIGRvbid0IHJlbW92ZSBpdC5cbiAgICAgIHZhciBpc0RhdGFUYWJsZSA9IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIHQuX3JlYWRhYmlsaXR5RGF0YVRhYmxlO1xuICAgICAgfTtcblxuICAgICAgdmFyIGlzTGlzdCA9IHRhZyA9PT0gXCJ1bFwiIHx8IHRhZyA9PT0gXCJvbFwiO1xuICAgICAgaWYgKCFpc0xpc3QpIHtcbiAgICAgICAgdmFyIGxpc3RMZW5ndGggPSAwO1xuICAgICAgICB2YXIgbGlzdE5vZGVzID0gdGhpcy5fZ2V0QWxsTm9kZXNXaXRoVGFnKG5vZGUsIFtcInVsXCIsIFwib2xcIl0pO1xuICAgICAgICB0aGlzLl9mb3JFYWNoTm9kZShsaXN0Tm9kZXMsIChsaXN0KSA9PiBsaXN0TGVuZ3RoICs9IHRoaXMuX2dldElubmVyVGV4dChsaXN0KS5sZW5ndGgpO1xuICAgICAgICBpc0xpc3QgPSBsaXN0TGVuZ3RoIC8gdGhpcy5fZ2V0SW5uZXJUZXh0KG5vZGUpLmxlbmd0aCA+IDAuOTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRhZyA9PT0gXCJ0YWJsZVwiICYmIGlzRGF0YVRhYmxlKG5vZGUpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gTmV4dCBjaGVjayBpZiB3ZSdyZSBpbnNpZGUgYSBkYXRhIHRhYmxlLCBpbiB3aGljaCBjYXNlIGRvbid0IHJlbW92ZSBpdCBhcyB3ZWxsLlxuICAgICAgaWYgKHRoaXMuX2hhc0FuY2VzdG9yVGFnKG5vZGUsIFwidGFibGVcIiwgLTEsIGlzRGF0YVRhYmxlKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9oYXNBbmNlc3RvclRhZyhub2RlLCBcImNvZGVcIikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICB2YXIgd2VpZ2h0ID0gdGhpcy5fZ2V0Q2xhc3NXZWlnaHQobm9kZSk7XG5cbiAgICAgIHRoaXMubG9nKFwiQ2xlYW5pbmcgQ29uZGl0aW9uYWxseVwiLCBub2RlKTtcblxuICAgICAgdmFyIGNvbnRlbnRTY29yZSA9IDA7XG5cbiAgICAgIGlmICh3ZWlnaHQgKyBjb250ZW50U2NvcmUgPCAwKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fZ2V0Q2hhckNvdW50KG5vZGUsIFwiLFwiKSA8IDEwKSB7XG4gICAgICAgIC8vIElmIHRoZXJlIGFyZSBub3QgdmVyeSBtYW55IGNvbW1hcywgYW5kIHRoZSBudW1iZXIgb2ZcbiAgICAgICAgLy8gbm9uLXBhcmFncmFwaCBlbGVtZW50cyBpcyBtb3JlIHRoYW4gcGFyYWdyYXBocyBvciBvdGhlclxuICAgICAgICAvLyBvbWlub3VzIHNpZ25zLCByZW1vdmUgdGhlIGVsZW1lbnQuXG4gICAgICAgIHZhciBwID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInBcIikubGVuZ3RoO1xuICAgICAgICB2YXIgaW1nID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImltZ1wiKS5sZW5ndGg7XG4gICAgICAgIHZhciBsaSA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJsaVwiKS5sZW5ndGggLSAxMDA7XG4gICAgICAgIHZhciBpbnB1dCA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbnB1dFwiKS5sZW5ndGg7XG4gICAgICAgIHZhciBoZWFkaW5nRGVuc2l0eSA9IHRoaXMuX2dldFRleHREZW5zaXR5KG5vZGUsIFtcImgxXCIsIFwiaDJcIiwgXCJoM1wiLCBcImg0XCIsIFwiaDVcIiwgXCJoNlwiXSk7XG5cbiAgICAgICAgdmFyIGVtYmVkQ291bnQgPSAwO1xuICAgICAgICB2YXIgZW1iZWRzID0gdGhpcy5fZ2V0QWxsTm9kZXNXaXRoVGFnKG5vZGUsIFtcIm9iamVjdFwiLCBcImVtYmVkXCIsIFwiaWZyYW1lXCJdKTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVtYmVkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIC8vIElmIHRoaXMgZW1iZWQgaGFzIGF0dHJpYnV0ZSB0aGF0IG1hdGNoZXMgdmlkZW8gcmVnZXgsIGRvbid0IGRlbGV0ZSBpdC5cbiAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGVtYmVkc1tpXS5hdHRyaWJ1dGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fYWxsb3dlZFZpZGVvUmVnZXgudGVzdChlbWJlZHNbaV0uYXR0cmlidXRlc1tqXS52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEZvciBlbWJlZCB3aXRoIDxvYmplY3Q+IHRhZywgY2hlY2sgaW5uZXIgSFRNTCBhcyB3ZWxsLlxuICAgICAgICAgIGlmIChlbWJlZHNbaV0udGFnTmFtZSA9PT0gXCJvYmplY3RcIiAmJiB0aGlzLl9hbGxvd2VkVmlkZW9SZWdleC50ZXN0KGVtYmVkc1tpXS5pbm5lckhUTUwpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZW1iZWRDb3VudCsrO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxpbmtEZW5zaXR5ID0gdGhpcy5fZ2V0TGlua0RlbnNpdHkobm9kZSk7XG4gICAgICAgIHZhciBjb250ZW50TGVuZ3RoID0gdGhpcy5fZ2V0SW5uZXJUZXh0KG5vZGUpLmxlbmd0aDtcblxuICAgICAgICB2YXIgaGF2ZVRvUmVtb3ZlID1cbiAgICAgICAgICAoaW1nID4gMSAmJiBwIC8gaW1nIDwgMC41ICYmICF0aGlzLl9oYXNBbmNlc3RvclRhZyhub2RlLCBcImZpZ3VyZVwiKSkgfHxcbiAgICAgICAgICAoIWlzTGlzdCAmJiBsaSA+IHApIHx8XG4gICAgICAgICAgKGlucHV0ID4gTWF0aC5mbG9vcihwLzMpKSB8fFxuICAgICAgICAgICghaXNMaXN0ICYmIGhlYWRpbmdEZW5zaXR5IDwgMC45ICYmIGNvbnRlbnRMZW5ndGggPCAyNSAmJiAoaW1nID09PSAwIHx8IGltZyA+IDIpICYmICF0aGlzLl9oYXNBbmNlc3RvclRhZyhub2RlLCBcImZpZ3VyZVwiKSkgfHxcbiAgICAgICAgICAoIWlzTGlzdCAmJiB3ZWlnaHQgPCAyNSAmJiBsaW5rRGVuc2l0eSA+IDAuMikgfHxcbiAgICAgICAgICAod2VpZ2h0ID49IDI1ICYmIGxpbmtEZW5zaXR5ID4gMC41KSB8fFxuICAgICAgICAgICgoZW1iZWRDb3VudCA9PT0gMSAmJiBjb250ZW50TGVuZ3RoIDwgNzUpIHx8IGVtYmVkQ291bnQgPiAxKTtcbiAgICAgICAgLy8gQWxsb3cgc2ltcGxlIGxpc3RzIG9mIGltYWdlcyB0byByZW1haW4gaW4gcGFnZXNcbiAgICAgICAgaWYgKGlzTGlzdCAmJiBoYXZlVG9SZW1vdmUpIHtcbiAgICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIGxldCBjaGlsZCA9IG5vZGUuY2hpbGRyZW5beF07XG4gICAgICAgICAgICAvLyBEb24ndCBmaWx0ZXIgaW4gbGlzdHMgd2l0aCBsaSdzIHRoYXQgY29udGFpbiBtb3JlIHRoYW4gb25lIGNoaWxkXG4gICAgICAgICAgICBpZiAoY2hpbGQuY2hpbGRyZW4ubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICByZXR1cm4gaGF2ZVRvUmVtb3ZlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBsZXQgbGlfY291bnQgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwibGlcIikubGVuZ3RoO1xuICAgICAgICAgIC8vIE9ubHkgYWxsb3cgdGhlIGxpc3QgdG8gcmVtYWluIGlmIGV2ZXJ5IGxpIGNvbnRhaW5zIGFuIGltYWdlXG4gICAgICAgICAgaWYgKGltZyA9PSBsaV9jb3VudCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaGF2ZVRvUmVtb3ZlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDbGVhbiBvdXQgZWxlbWVudHMgdGhhdCBtYXRjaCB0aGUgc3BlY2lmaWVkIGNvbmRpdGlvbnNcbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHBhcmFtIEZ1bmN0aW9uIGRldGVybWluZXMgd2hldGhlciBhIG5vZGUgc2hvdWxkIGJlIHJlbW92ZWRcbiAgICogQHJldHVybiB2b2lkXG4gICAqKi9cbiAgX2NsZWFuTWF0Y2hlZE5vZGVzOiBmdW5jdGlvbihlLCBmaWx0ZXIpIHtcbiAgICB2YXIgZW5kT2ZTZWFyY2hNYXJrZXJOb2RlID0gdGhpcy5fZ2V0TmV4dE5vZGUoZSwgdHJ1ZSk7XG4gICAgdmFyIG5leHQgPSB0aGlzLl9nZXROZXh0Tm9kZShlKTtcbiAgICB3aGlsZSAobmV4dCAmJiBuZXh0ICE9IGVuZE9mU2VhcmNoTWFya2VyTm9kZSkge1xuICAgICAgaWYgKGZpbHRlci5jYWxsKHRoaXMsIG5leHQsIG5leHQuY2xhc3NOYW1lICsgXCIgXCIgKyBuZXh0LmlkKSkge1xuICAgICAgICBuZXh0ID0gdGhpcy5fcmVtb3ZlQW5kR2V0TmV4dChuZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5leHQgPSB0aGlzLl9nZXROZXh0Tm9kZShuZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIENsZWFuIG91dCBzcHVyaW91cyBoZWFkZXJzIGZyb20gYW4gRWxlbWVudC5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnRcbiAgICogQHJldHVybiB2b2lkXG4gICoqL1xuICBfY2xlYW5IZWFkZXJzOiBmdW5jdGlvbihlKSB7XG4gICAgbGV0IGhlYWRpbmdOb2RlcyA9IHRoaXMuX2dldEFsbE5vZGVzV2l0aFRhZyhlLCBbXCJoMVwiLCBcImgyXCJdKTtcbiAgICB0aGlzLl9yZW1vdmVOb2RlcyhoZWFkaW5nTm9kZXMsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIGxldCBzaG91bGRSZW1vdmUgPSB0aGlzLl9nZXRDbGFzc1dlaWdodChub2RlKSA8IDA7XG4gICAgICBpZiAoc2hvdWxkUmVtb3ZlKSB7XG4gICAgICAgIHRoaXMubG9nKFwiUmVtb3ZpbmcgaGVhZGVyIHdpdGggbG93IGNsYXNzIHdlaWdodDpcIiwgbm9kZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2hvdWxkUmVtb3ZlO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGlzIG5vZGUgaXMgYW4gSDEgb3IgSDIgZWxlbWVudCB3aG9zZSBjb250ZW50IGlzIG1vc3RseVxuICAgKiB0aGUgc2FtZSBhcyB0aGUgYXJ0aWNsZSB0aXRsZS5cbiAgICpcbiAgICogQHBhcmFtIEVsZW1lbnQgIHRoZSBub2RlIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJuIGJvb2xlYW4gaW5kaWNhdGluZyB3aGV0aGVyIHRoaXMgaXMgYSB0aXRsZS1saWtlIGhlYWRlci5cbiAgICovXG4gIF9oZWFkZXJEdXBsaWNhdGVzVGl0bGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICBpZiAobm9kZS50YWdOYW1lICE9IFwiSDFcIiAmJiBub2RlLnRhZ05hbWUgIT0gXCJIMlwiKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBoZWFkaW5nID0gdGhpcy5fZ2V0SW5uZXJUZXh0KG5vZGUsIGZhbHNlKTtcbiAgICB0aGlzLmxvZyhcIkV2YWx1YXRpbmcgc2ltaWxhcml0eSBvZiBoZWFkZXI6XCIsIGhlYWRpbmcsIHRoaXMuX2FydGljbGVUaXRsZSk7XG4gICAgcmV0dXJuIHRoaXMuX3RleHRTaW1pbGFyaXR5KHRoaXMuX2FydGljbGVUaXRsZSwgaGVhZGluZykgPiAwLjc1O1xuICB9LFxuXG4gIF9mbGFnSXNBY3RpdmU6IGZ1bmN0aW9uKGZsYWcpIHtcbiAgICByZXR1cm4gKHRoaXMuX2ZsYWdzICYgZmxhZykgPiAwO1xuICB9LFxuXG4gIF9yZW1vdmVGbGFnOiBmdW5jdGlvbihmbGFnKSB7XG4gICAgdGhpcy5fZmxhZ3MgPSB0aGlzLl9mbGFncyAmIH5mbGFnO1xuICB9LFxuXG4gIF9pc1Byb2JhYmx5VmlzaWJsZTogZnVuY3Rpb24obm9kZSkge1xuICAgIC8vIEhhdmUgdG8gbnVsbC1jaGVjayBub2RlLnN0eWxlIGFuZCBub2RlLmNsYXNzTmFtZS5pbmRleE9mIHRvIGRlYWwgd2l0aCBTVkcgYW5kIE1hdGhNTCBub2Rlcy5cbiAgICByZXR1cm4gKCFub2RlLnN0eWxlIHx8IG5vZGUuc3R5bGUuZGlzcGxheSAhPSBcIm5vbmVcIilcbiAgICAgICYmICghbm9kZS5zdHlsZSB8fCBub2RlLnN0eWxlLnZpc2liaWxpdHkgIT0gXCJoaWRkZW5cIilcbiAgICAgICYmICFub2RlLmhhc0F0dHJpYnV0ZShcImhpZGRlblwiKVxuICAgICAgLy9jaGVjayBmb3IgXCJmYWxsYmFjay1pbWFnZVwiIHNvIHRoYXQgd2lraW1lZGlhIG1hdGggaW1hZ2VzIGFyZSBkaXNwbGF5ZWRcbiAgICAgICYmICghbm9kZS5oYXNBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiKSB8fCBub2RlLmdldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIpICE9IFwidHJ1ZVwiIHx8IChub2RlLmNsYXNzTmFtZSAmJiBub2RlLmNsYXNzTmFtZS5pbmRleE9mICYmIG5vZGUuY2xhc3NOYW1lLmluZGV4T2YoXCJmYWxsYmFjay1pbWFnZVwiKSAhPT0gLTEpKTtcbiAgfSxcblxuICAvKipcbiAgICogUnVucyByZWFkYWJpbGl0eS5cbiAgICpcbiAgICogV29ya2Zsb3c6XG4gICAqICAxLiBQcmVwIHRoZSBkb2N1bWVudCBieSByZW1vdmluZyBzY3JpcHQgdGFncywgY3NzLCBldGMuXG4gICAqICAyLiBCdWlsZCByZWFkYWJpbGl0eSdzIERPTSB0cmVlLlxuICAgKiAgMy4gR3JhYiB0aGUgYXJ0aWNsZSBjb250ZW50IGZyb20gdGhlIGN1cnJlbnQgZG9tIHRyZWUuXG4gICAqICA0LiBSZXBsYWNlIHRoZSBjdXJyZW50IERPTSB0cmVlIHdpdGggdGhlIG5ldyBvbmUuXG4gICAqICA1LiBSZWFkIHBlYWNlZnVsbHkuXG4gICAqXG4gICAqIEByZXR1cm4gdm9pZFxuICAgKiovXG4gIHBhcnNlOiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gQXZvaWQgcGFyc2luZyB0b28gbGFyZ2UgZG9jdW1lbnRzLCBhcyBwZXIgY29uZmlndXJhdGlvbiBvcHRpb25cbiAgICBpZiAodGhpcy5fbWF4RWxlbXNUb1BhcnNlID4gMCkge1xuICAgICAgdmFyIG51bVRhZ3MgPSB0aGlzLl9kb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCIqXCIpLmxlbmd0aDtcbiAgICAgIGlmIChudW1UYWdzID4gdGhpcy5fbWF4RWxlbXNUb1BhcnNlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkFib3J0aW5nIHBhcnNpbmcgZG9jdW1lbnQ7IFwiICsgbnVtVGFncyArIFwiIGVsZW1lbnRzIGZvdW5kXCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFVud3JhcCBpbWFnZSBmcm9tIG5vc2NyaXB0XG4gICAgdGhpcy5fdW53cmFwTm9zY3JpcHRJbWFnZXModGhpcy5fZG9jKTtcblxuICAgIC8vIEV4dHJhY3QgSlNPTi1MRCBtZXRhZGF0YSBiZWZvcmUgcmVtb3Zpbmcgc2NyaXB0c1xuICAgIHZhciBqc29uTGQgPSB0aGlzLl9kaXNhYmxlSlNPTkxEID8ge30gOiB0aGlzLl9nZXRKU09OTEQodGhpcy5fZG9jKTtcblxuICAgIC8vIFJlbW92ZSBzY3JpcHQgdGFncyBmcm9tIHRoZSBkb2N1bWVudC5cbiAgICB0aGlzLl9yZW1vdmVTY3JpcHRzKHRoaXMuX2RvYyk7XG5cbiAgICB0aGlzLl9wcmVwRG9jdW1lbnQoKTtcblxuICAgIHZhciBtZXRhZGF0YSA9IHRoaXMuX2dldEFydGljbGVNZXRhZGF0YShqc29uTGQpO1xuICAgIHRoaXMuX2FydGljbGVUaXRsZSA9IG1ldGFkYXRhLnRpdGxlO1xuXG4gICAgdmFyIGFydGljbGVDb250ZW50ID0gdGhpcy5fZ3JhYkFydGljbGUoKTtcbiAgICBpZiAoIWFydGljbGVDb250ZW50KVxuICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICB0aGlzLmxvZyhcIkdyYWJiZWQ6IFwiICsgYXJ0aWNsZUNvbnRlbnQuaW5uZXJIVE1MKTtcblxuICAgIHRoaXMuX3Bvc3RQcm9jZXNzQ29udGVudChhcnRpY2xlQ29udGVudCk7XG5cbiAgICAvLyBJZiB3ZSBoYXZlbid0IGZvdW5kIGFuIGV4Y2VycHQgaW4gdGhlIGFydGljbGUncyBtZXRhZGF0YSwgdXNlIHRoZSBhcnRpY2xlJ3NcbiAgICAvLyBmaXJzdCBwYXJhZ3JhcGggYXMgdGhlIGV4Y2VycHQuIFRoaXMgaXMgdXNlZCBmb3IgZGlzcGxheWluZyBhIHByZXZpZXcgb2ZcbiAgICAvLyB0aGUgYXJ0aWNsZSdzIGNvbnRlbnQuXG4gICAgaWYgKCFtZXRhZGF0YS5leGNlcnB0KSB7XG4gICAgICB2YXIgcGFyYWdyYXBocyA9IGFydGljbGVDb250ZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicFwiKTtcbiAgICAgIGlmIChwYXJhZ3JhcGhzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbWV0YWRhdGEuZXhjZXJwdCA9IHBhcmFncmFwaHNbMF0udGV4dENvbnRlbnQudHJpbSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciB0ZXh0Q29udGVudCA9IGFydGljbGVDb250ZW50LnRleHRDb250ZW50O1xuICAgIHJldHVybiB7XG4gICAgICB0aXRsZTogdGhpcy5fYXJ0aWNsZVRpdGxlLFxuICAgICAgYnlsaW5lOiBtZXRhZGF0YS5ieWxpbmUgfHwgdGhpcy5fYXJ0aWNsZUJ5bGluZSxcbiAgICAgIGRpcjogdGhpcy5fYXJ0aWNsZURpcixcbiAgICAgIGxhbmc6IHRoaXMuX2FydGljbGVMYW5nLFxuICAgICAgY29udGVudDogdGhpcy5fc2VyaWFsaXplcihhcnRpY2xlQ29udGVudCksXG4gICAgICB0ZXh0Q29udGVudDogdGV4dENvbnRlbnQsXG4gICAgICBsZW5ndGg6IHRleHRDb250ZW50Lmxlbmd0aCxcbiAgICAgIGV4Y2VycHQ6IG1ldGFkYXRhLmV4Y2VycHQsXG4gICAgICBzaXRlTmFtZTogbWV0YWRhdGEuc2l0ZU5hbWUgfHwgdGhpcy5fYXJ0aWNsZVNpdGVOYW1lLFxuICAgICAgcHVibGlzaGVkVGltZTogbWV0YWRhdGEucHVibGlzaGVkVGltZVxuICAgIH07XG4gIH1cbn07XG5cbmlmICh0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiKSB7XG4gIC8qIGdsb2JhbCBtb2R1bGUgKi9cbiAgbW9kdWxlLmV4cG9ydHMgPSBSZWFkYWJpbGl0eTtcbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAgQXJjOTAgSW5jXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qXG4gKiBUaGlzIGNvZGUgaXMgaGVhdmlseSBiYXNlZCBvbiBBcmM5MCdzIHJlYWRhYmlsaXR5LmpzICgxLjcuMSkgc2NyaXB0XG4gKiBhdmFpbGFibGUgYXQ6IGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9hcmM5MGxhYnMtcmVhZGFiaWxpdHlcbiAqL1xuXG52YXIgUkVHRVhQUyA9IHtcbiAgLy8gTk9URTogVGhlc2UgdHdvIHJlZ3VsYXIgZXhwcmVzc2lvbnMgYXJlIGR1cGxpY2F0ZWQgaW5cbiAgLy8gUmVhZGFiaWxpdHkuanMuIFBsZWFzZSBrZWVwIGJvdGggY29waWVzIGluIHN5bmMuXG4gIHVubGlrZWx5Q2FuZGlkYXRlczogLy1hZC18YWkyaHRtbHxiYW5uZXJ8YnJlYWRjcnVtYnN8Y29tYnh8Y29tbWVudHxjb21tdW5pdHl8Y292ZXItd3JhcHxkaXNxdXN8ZXh0cmF8Zm9vdGVyfGdkcHJ8aGVhZGVyfGxlZ2VuZHN8bWVudXxyZWxhdGVkfHJlbWFya3xyZXBsaWVzfHJzc3xzaG91dGJveHxzaWRlYmFyfHNreXNjcmFwZXJ8c29jaWFsfHNwb25zb3J8c3VwcGxlbWVudGFsfGFkLWJyZWFrfGFnZWdhdGV8cGFnaW5hdGlvbnxwYWdlcnxwb3B1cHx5b20tcmVtb3RlL2ksXG4gIG9rTWF5YmVJdHNBQ2FuZGlkYXRlOiAvYW5kfGFydGljbGV8Ym9keXxjb2x1bW58Y29udGVudHxtYWlufHNoYWRvdy9pLFxufTtcblxuZnVuY3Rpb24gaXNOb2RlVmlzaWJsZShub2RlKSB7XG4gIC8vIEhhdmUgdG8gbnVsbC1jaGVjayBub2RlLnN0eWxlIGFuZCBub2RlLmNsYXNzTmFtZS5pbmRleE9mIHRvIGRlYWwgd2l0aCBTVkcgYW5kIE1hdGhNTCBub2Rlcy5cbiAgcmV0dXJuICghbm9kZS5zdHlsZSB8fCBub2RlLnN0eWxlLmRpc3BsYXkgIT0gXCJub25lXCIpXG4gICAgJiYgIW5vZGUuaGFzQXR0cmlidXRlKFwiaGlkZGVuXCIpXG4gICAgLy9jaGVjayBmb3IgXCJmYWxsYmFjay1pbWFnZVwiIHNvIHRoYXQgd2lraW1lZGlhIG1hdGggaW1hZ2VzIGFyZSBkaXNwbGF5ZWRcbiAgICAmJiAoIW5vZGUuaGFzQXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIikgfHwgbm9kZS5nZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiKSAhPSBcInRydWVcIiB8fCAobm9kZS5jbGFzc05hbWUgJiYgbm9kZS5jbGFzc05hbWUuaW5kZXhPZiAmJiBub2RlLmNsYXNzTmFtZS5pbmRleE9mKFwiZmFsbGJhY2staW1hZ2VcIikgIT09IC0xKSk7XG59XG5cbi8qKlxuICogRGVjaWRlcyB3aGV0aGVyIG9yIG5vdCB0aGUgZG9jdW1lbnQgaXMgcmVhZGVyLWFibGUgd2l0aG91dCBwYXJzaW5nIHRoZSB3aG9sZSB0aGluZy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIENvbmZpZ3VyYXRpb24gb2JqZWN0LlxuICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1pbkNvbnRlbnRMZW5ndGg9MTQwXSBUaGUgbWluaW11bSBub2RlIGNvbnRlbnQgbGVuZ3RoIHVzZWQgdG8gZGVjaWRlIGlmIHRoZSBkb2N1bWVudCBpcyByZWFkZXJhYmxlLlxuICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1pblNjb3JlPTIwXSBUaGUgbWludW11bSBjdW11bGF0ZWQgJ3Njb3JlJyB1c2VkIHRvIGRldGVybWluZSBpZiB0aGUgZG9jdW1lbnQgaXMgcmVhZGVyYWJsZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtvcHRpb25zLnZpc2liaWxpdHlDaGVja2VyPWlzTm9kZVZpc2libGVdIFRoZSBmdW5jdGlvbiB1c2VkIHRvIGRldGVybWluZSBpZiBhIG5vZGUgaXMgdmlzaWJsZS5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgb3Igbm90IHdlIHN1c3BlY3QgUmVhZGFiaWxpdHkucGFyc2UoKSB3aWxsIHN1Y2VlZWQgYXQgcmV0dXJuaW5nIGFuIGFydGljbGUgb2JqZWN0LlxuICovXG5mdW5jdGlvbiBpc1Byb2JhYmx5UmVhZGVyYWJsZShkb2MsIG9wdGlvbnMgPSB7fSkge1xuICAvLyBGb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSByZWFzb25zICdvcHRpb25zJyBjYW4gZWl0aGVyIGJlIGEgY29uZmlndXJhdGlvbiBvYmplY3Qgb3IgdGhlIGZ1bmN0aW9uIHVzZWRcbiAgLy8gdG8gZGV0ZXJtaW5lIGlmIGEgbm9kZSBpcyB2aXNpYmxlLlxuICBpZiAodHlwZW9mIG9wdGlvbnMgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgb3B0aW9ucyA9IHsgdmlzaWJpbGl0eUNoZWNrZXI6IG9wdGlvbnMgfTtcbiAgfVxuXG4gIHZhciBkZWZhdWx0T3B0aW9ucyA9IHsgbWluU2NvcmU6IDIwLCBtaW5Db250ZW50TGVuZ3RoOiAxNDAsIHZpc2liaWxpdHlDaGVja2VyOiBpc05vZGVWaXNpYmxlIH07XG4gIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcblxuICB2YXIgbm9kZXMgPSBkb2MucXVlcnlTZWxlY3RvckFsbChcInAsIHByZSwgYXJ0aWNsZVwiKTtcblxuICAvLyBHZXQgPGRpdj4gbm9kZXMgd2hpY2ggaGF2ZSA8YnI+IG5vZGUocykgYW5kIGFwcGVuZCB0aGVtIGludG8gdGhlIGBub2Rlc2AgdmFyaWFibGUuXG4gIC8vIFNvbWUgYXJ0aWNsZXMnIERPTSBzdHJ1Y3R1cmVzIG1pZ2h0IGxvb2sgbGlrZVxuICAvLyA8ZGl2PlxuICAvLyAgIFNlbnRlbmNlczxicj5cbiAgLy8gICA8YnI+XG4gIC8vICAgU2VudGVuY2VzPGJyPlxuICAvLyA8L2Rpdj5cbiAgdmFyIGJyTm9kZXMgPSBkb2MucXVlcnlTZWxlY3RvckFsbChcImRpdiA+IGJyXCIpO1xuICBpZiAoYnJOb2Rlcy5sZW5ndGgpIHtcbiAgICB2YXIgc2V0ID0gbmV3IFNldChub2Rlcyk7XG4gICAgW10uZm9yRWFjaC5jYWxsKGJyTm9kZXMsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICBzZXQuYWRkKG5vZGUucGFyZW50Tm9kZSk7XG4gICAgfSk7XG4gICAgbm9kZXMgPSBBcnJheS5mcm9tKHNldCk7XG4gIH1cblxuICB2YXIgc2NvcmUgPSAwO1xuICAvLyBUaGlzIGlzIGEgbGl0dGxlIGNoZWVreSwgd2UgdXNlIHRoZSBhY2N1bXVsYXRvciAnc2NvcmUnIHRvIGRlY2lkZSB3aGF0IHRvIHJldHVybiBmcm9tXG4gIC8vIHRoaXMgY2FsbGJhY2s6XG4gIHJldHVybiBbXS5zb21lLmNhbGwobm9kZXMsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgaWYgKCFvcHRpb25zLnZpc2liaWxpdHlDaGVja2VyKG5vZGUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIG1hdGNoU3RyaW5nID0gbm9kZS5jbGFzc05hbWUgKyBcIiBcIiArIG5vZGUuaWQ7XG4gICAgaWYgKFJFR0VYUFMudW5saWtlbHlDYW5kaWRhdGVzLnRlc3QobWF0Y2hTdHJpbmcpICYmXG4gICAgICAgICFSRUdFWFBTLm9rTWF5YmVJdHNBQ2FuZGlkYXRlLnRlc3QobWF0Y2hTdHJpbmcpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKG5vZGUubWF0Y2hlcyhcImxpIHBcIikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgdGV4dENvbnRlbnRMZW5ndGggPSBub2RlLnRleHRDb250ZW50LnRyaW0oKS5sZW5ndGg7XG4gICAgaWYgKHRleHRDb250ZW50TGVuZ3RoIDwgb3B0aW9ucy5taW5Db250ZW50TGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgc2NvcmUgKz0gTWF0aC5zcXJ0KHRleHRDb250ZW50TGVuZ3RoIC0gb3B0aW9ucy5taW5Db250ZW50TGVuZ3RoKTtcblxuICAgIGlmIChzY29yZSA+IG9wdGlvbnMubWluU2NvcmUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xufVxuXG5pZiAodHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIikge1xuICAvKiBnbG9iYWwgbW9kdWxlICovXG4gIG1vZHVsZS5leHBvcnRzID0gaXNQcm9iYWJseVJlYWRlcmFibGU7XG59XG4iLCIvKiBlc2xpbnQtZW52IG5vZGUgKi9cbnZhciBSZWFkYWJpbGl0eSA9IHJlcXVpcmUoXCIuL1JlYWRhYmlsaXR5XCIpO1xudmFyIGlzUHJvYmFibHlSZWFkZXJhYmxlID0gcmVxdWlyZShcIi4vUmVhZGFiaWxpdHktcmVhZGVyYWJsZVwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIFJlYWRhYmlsaXR5OiBSZWFkYWJpbGl0eSxcbiAgaXNQcm9iYWJseVJlYWRlcmFibGU6IGlzUHJvYmFibHlSZWFkZXJhYmxlXG59O1xuIiwiZnVuY3Rpb24gZXh0ZW5kIChkZXN0aW5hdGlvbikge1xuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07XG4gICAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSBkZXN0aW5hdGlvbltrZXldID0gc291cmNlW2tleV07XG4gICAgfVxuICB9XG4gIHJldHVybiBkZXN0aW5hdGlvblxufVxuXG5mdW5jdGlvbiByZXBlYXQgKGNoYXJhY3RlciwgY291bnQpIHtcbiAgcmV0dXJuIEFycmF5KGNvdW50ICsgMSkuam9pbihjaGFyYWN0ZXIpXG59XG5cbmZ1bmN0aW9uIHRyaW1MZWFkaW5nTmV3bGluZXMgKHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL15cXG4qLywgJycpXG59XG5cbmZ1bmN0aW9uIHRyaW1UcmFpbGluZ05ld2xpbmVzIChzdHJpbmcpIHtcbiAgLy8gYXZvaWQgbWF0Y2gtYXQtZW5kIHJlZ2V4cCBib3R0bGVuZWNrLCBzZWUgIzM3MFxuICB2YXIgaW5kZXhFbmQgPSBzdHJpbmcubGVuZ3RoO1xuICB3aGlsZSAoaW5kZXhFbmQgPiAwICYmIHN0cmluZ1tpbmRleEVuZCAtIDFdID09PSAnXFxuJykgaW5kZXhFbmQtLTtcbiAgcmV0dXJuIHN0cmluZy5zdWJzdHJpbmcoMCwgaW5kZXhFbmQpXG59XG5cbmZ1bmN0aW9uIHRyaW1OZXdsaW5lcyAoc3RyaW5nKSB7XG4gIHJldHVybiB0cmltVHJhaWxpbmdOZXdsaW5lcyh0cmltTGVhZGluZ05ld2xpbmVzKHN0cmluZykpXG59XG5cbnZhciBibG9ja0VsZW1lbnRzID0gW1xuICAnQUREUkVTUycsICdBUlRJQ0xFJywgJ0FTSURFJywgJ0FVRElPJywgJ0JMT0NLUVVPVEUnLCAnQk9EWScsICdDQU5WQVMnLFxuICAnQ0VOVEVSJywgJ0REJywgJ0RJUicsICdESVYnLCAnREwnLCAnRFQnLCAnRklFTERTRVQnLCAnRklHQ0FQVElPTicsICdGSUdVUkUnLFxuICAnRk9PVEVSJywgJ0ZPUk0nLCAnRlJBTUVTRVQnLCAnSDEnLCAnSDInLCAnSDMnLCAnSDQnLCAnSDUnLCAnSDYnLCAnSEVBREVSJyxcbiAgJ0hHUk9VUCcsICdIUicsICdIVE1MJywgJ0lTSU5ERVgnLCAnTEknLCAnTUFJTicsICdNRU5VJywgJ05BVicsICdOT0ZSQU1FUycsXG4gICdOT1NDUklQVCcsICdPTCcsICdPVVRQVVQnLCAnUCcsICdQUkUnLCAnU0VDVElPTicsICdUQUJMRScsICdUQk9EWScsICdURCcsXG4gICdURk9PVCcsICdUSCcsICdUSEVBRCcsICdUUicsICdVTCdcbl07XG5cbmZ1bmN0aW9uIGlzQmxvY2sgKG5vZGUpIHtcbiAgcmV0dXJuIGlzKG5vZGUsIGJsb2NrRWxlbWVudHMpXG59XG5cbnZhciB2b2lkRWxlbWVudHMgPSBbXG4gICdBUkVBJywgJ0JBU0UnLCAnQlInLCAnQ09MJywgJ0NPTU1BTkQnLCAnRU1CRUQnLCAnSFInLCAnSU1HJywgJ0lOUFVUJyxcbiAgJ0tFWUdFTicsICdMSU5LJywgJ01FVEEnLCAnUEFSQU0nLCAnU09VUkNFJywgJ1RSQUNLJywgJ1dCUidcbl07XG5cbmZ1bmN0aW9uIGlzVm9pZCAobm9kZSkge1xuICByZXR1cm4gaXMobm9kZSwgdm9pZEVsZW1lbnRzKVxufVxuXG5mdW5jdGlvbiBoYXNWb2lkIChub2RlKSB7XG4gIHJldHVybiBoYXMobm9kZSwgdm9pZEVsZW1lbnRzKVxufVxuXG52YXIgbWVhbmluZ2Z1bFdoZW5CbGFua0VsZW1lbnRzID0gW1xuICAnQScsICdUQUJMRScsICdUSEVBRCcsICdUQk9EWScsICdURk9PVCcsICdUSCcsICdURCcsICdJRlJBTUUnLCAnU0NSSVBUJyxcbiAgJ0FVRElPJywgJ1ZJREVPJ1xuXTtcblxuZnVuY3Rpb24gaXNNZWFuaW5nZnVsV2hlbkJsYW5rIChub2RlKSB7XG4gIHJldHVybiBpcyhub2RlLCBtZWFuaW5nZnVsV2hlbkJsYW5rRWxlbWVudHMpXG59XG5cbmZ1bmN0aW9uIGhhc01lYW5pbmdmdWxXaGVuQmxhbmsgKG5vZGUpIHtcbiAgcmV0dXJuIGhhcyhub2RlLCBtZWFuaW5nZnVsV2hlbkJsYW5rRWxlbWVudHMpXG59XG5cbmZ1bmN0aW9uIGlzIChub2RlLCB0YWdOYW1lcykge1xuICByZXR1cm4gdGFnTmFtZXMuaW5kZXhPZihub2RlLm5vZGVOYW1lKSA+PSAwXG59XG5cbmZ1bmN0aW9uIGhhcyAobm9kZSwgdGFnTmFtZXMpIHtcbiAgcmV0dXJuIChcbiAgICBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lICYmXG4gICAgdGFnTmFtZXMuc29tZShmdW5jdGlvbiAodGFnTmFtZSkge1xuICAgICAgcmV0dXJuIG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnTmFtZSkubGVuZ3RoXG4gICAgfSlcbiAgKVxufVxuXG52YXIgcnVsZXMgPSB7fTtcblxucnVsZXMucGFyYWdyYXBoID0ge1xuICBmaWx0ZXI6ICdwJyxcblxuICByZXBsYWNlbWVudDogZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAgICByZXR1cm4gJ1xcblxcbicgKyBjb250ZW50ICsgJ1xcblxcbidcbiAgfVxufTtcblxucnVsZXMubGluZUJyZWFrID0ge1xuICBmaWx0ZXI6ICdicicsXG5cbiAgcmVwbGFjZW1lbnQ6IGZ1bmN0aW9uIChjb250ZW50LCBub2RlLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMuYnIgKyAnXFxuJ1xuICB9XG59O1xuXG5ydWxlcy5oZWFkaW5nID0ge1xuICBmaWx0ZXI6IFsnaDEnLCAnaDInLCAnaDMnLCAnaDQnLCAnaDUnLCAnaDYnXSxcblxuICByZXBsYWNlbWVudDogZnVuY3Rpb24gKGNvbnRlbnQsIG5vZGUsIG9wdGlvbnMpIHtcbiAgICB2YXIgaExldmVsID0gTnVtYmVyKG5vZGUubm9kZU5hbWUuY2hhckF0KDEpKTtcblxuICAgIGlmIChvcHRpb25zLmhlYWRpbmdTdHlsZSA9PT0gJ3NldGV4dCcgJiYgaExldmVsIDwgMykge1xuICAgICAgdmFyIHVuZGVybGluZSA9IHJlcGVhdCgoaExldmVsID09PSAxID8gJz0nIDogJy0nKSwgY29udGVudC5sZW5ndGgpO1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgJ1xcblxcbicgKyBjb250ZW50ICsgJ1xcbicgKyB1bmRlcmxpbmUgKyAnXFxuXFxuJ1xuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ1xcblxcbicgKyByZXBlYXQoJyMnLCBoTGV2ZWwpICsgJyAnICsgY29udGVudCArICdcXG5cXG4nXG4gICAgfVxuICB9XG59O1xuXG5ydWxlcy5ibG9ja3F1b3RlID0ge1xuICBmaWx0ZXI6ICdibG9ja3F1b3RlJyxcblxuICByZXBsYWNlbWVudDogZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAgICBjb250ZW50ID0gdHJpbU5ld2xpbmVzKGNvbnRlbnQpLnJlcGxhY2UoL14vZ20sICc+ICcpO1xuICAgIHJldHVybiAnXFxuXFxuJyArIGNvbnRlbnQgKyAnXFxuXFxuJ1xuICB9XG59O1xuXG5ydWxlcy5saXN0ID0ge1xuICBmaWx0ZXI6IFsndWwnLCAnb2wnXSxcblxuICByZXBsYWNlbWVudDogZnVuY3Rpb24gKGNvbnRlbnQsIG5vZGUpIHtcbiAgICB2YXIgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIGlmIChwYXJlbnQubm9kZU5hbWUgPT09ICdMSScgJiYgcGFyZW50Lmxhc3RFbGVtZW50Q2hpbGQgPT09IG5vZGUpIHtcbiAgICAgIHJldHVybiAnXFxuJyArIGNvbnRlbnRcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICdcXG5cXG4nICsgY29udGVudCArICdcXG5cXG4nXG4gICAgfVxuICB9XG59O1xuXG5ydWxlcy5saXN0SXRlbSA9IHtcbiAgZmlsdGVyOiAnbGknLFxuXG4gIHJlcGxhY2VtZW50OiBmdW5jdGlvbiAoY29udGVudCwgbm9kZSwgb3B0aW9ucykge1xuICAgIHZhciBwcmVmaXggPSBvcHRpb25zLmJ1bGxldExpc3RNYXJrZXIgKyAnICAgJztcbiAgICB2YXIgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIGlmIChwYXJlbnQubm9kZU5hbWUgPT09ICdPTCcpIHtcbiAgICAgIHZhciBzdGFydCA9IHBhcmVudC5nZXRBdHRyaWJ1dGUoJ3N0YXJ0Jyk7XG4gICAgICB2YXIgaW5kZXggPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKHBhcmVudC5jaGlsZHJlbiwgbm9kZSk7XG4gICAgICBwcmVmaXggPSAoc3RhcnQgPyBOdW1iZXIoc3RhcnQpICsgaW5kZXggOiBpbmRleCArIDEpICsgJy4gICc7XG4gICAgfVxuICAgIHZhciBpc1BhcmFncmFwaCA9IC9cXG4kLy50ZXN0KGNvbnRlbnQpO1xuICAgIGNvbnRlbnQgPSB0cmltTmV3bGluZXMoY29udGVudCkgKyAoaXNQYXJhZ3JhcGggPyAnXFxuJyA6ICcnKTtcbiAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC9cXG4vZ20sICdcXG4nICsgJyAnLnJlcGVhdChwcmVmaXgubGVuZ3RoKSk7IC8vIGluZGVudFxuICAgIHJldHVybiAoXG4gICAgICBwcmVmaXggKyBjb250ZW50ICsgKG5vZGUubmV4dFNpYmxpbmcgPyAnXFxuJyA6ICcnKVxuICAgIClcbiAgfVxufTtcblxucnVsZXMuaW5kZW50ZWRDb2RlQmxvY2sgPSB7XG4gIGZpbHRlcjogZnVuY3Rpb24gKG5vZGUsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gKFxuICAgICAgb3B0aW9ucy5jb2RlQmxvY2tTdHlsZSA9PT0gJ2luZGVudGVkJyAmJlxuICAgICAgbm9kZS5ub2RlTmFtZSA9PT0gJ1BSRScgJiZcbiAgICAgIG5vZGUuZmlyc3RDaGlsZCAmJlxuICAgICAgbm9kZS5maXJzdENoaWxkLm5vZGVOYW1lID09PSAnQ09ERSdcbiAgICApXG4gIH0sXG5cbiAgcmVwbGFjZW1lbnQ6IGZ1bmN0aW9uIChjb250ZW50LCBub2RlLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICdcXG5cXG4gICAgJyArXG4gICAgICBub2RlLmZpcnN0Q2hpbGQudGV4dENvbnRlbnQucmVwbGFjZSgvXFxuL2csICdcXG4gICAgJykgK1xuICAgICAgJ1xcblxcbidcbiAgICApXG4gIH1cbn07XG5cbnJ1bGVzLmZlbmNlZENvZGVCbG9jayA9IHtcbiAgZmlsdGVyOiBmdW5jdGlvbiAobm9kZSwgb3B0aW9ucykge1xuICAgIHJldHVybiAoXG4gICAgICBvcHRpb25zLmNvZGVCbG9ja1N0eWxlID09PSAnZmVuY2VkJyAmJlxuICAgICAgbm9kZS5ub2RlTmFtZSA9PT0gJ1BSRScgJiZcbiAgICAgIG5vZGUuZmlyc3RDaGlsZCAmJlxuICAgICAgbm9kZS5maXJzdENoaWxkLm5vZGVOYW1lID09PSAnQ09ERSdcbiAgICApXG4gIH0sXG5cbiAgcmVwbGFjZW1lbnQ6IGZ1bmN0aW9uIChjb250ZW50LCBub2RlLCBvcHRpb25zKSB7XG4gICAgdmFyIGNsYXNzTmFtZSA9IG5vZGUuZmlyc3RDaGlsZC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykgfHwgJyc7XG4gICAgdmFyIGxhbmd1YWdlID0gKGNsYXNzTmFtZS5tYXRjaCgvbGFuZ3VhZ2UtKFxcUyspLykgfHwgW251bGwsICcnXSlbMV07XG4gICAgdmFyIGNvZGUgPSBub2RlLmZpcnN0Q2hpbGQudGV4dENvbnRlbnQ7XG5cbiAgICB2YXIgZmVuY2VDaGFyID0gb3B0aW9ucy5mZW5jZS5jaGFyQXQoMCk7XG4gICAgdmFyIGZlbmNlU2l6ZSA9IDM7XG4gICAgdmFyIGZlbmNlSW5Db2RlUmVnZXggPSBuZXcgUmVnRXhwKCdeJyArIGZlbmNlQ2hhciArICd7Myx9JywgJ2dtJyk7XG5cbiAgICB2YXIgbWF0Y2g7XG4gICAgd2hpbGUgKChtYXRjaCA9IGZlbmNlSW5Db2RlUmVnZXguZXhlYyhjb2RlKSkpIHtcbiAgICAgIGlmIChtYXRjaFswXS5sZW5ndGggPj0gZmVuY2VTaXplKSB7XG4gICAgICAgIGZlbmNlU2l6ZSA9IG1hdGNoWzBdLmxlbmd0aCArIDE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGZlbmNlID0gcmVwZWF0KGZlbmNlQ2hhciwgZmVuY2VTaXplKTtcblxuICAgIHJldHVybiAoXG4gICAgICAnXFxuXFxuJyArIGZlbmNlICsgbGFuZ3VhZ2UgKyAnXFxuJyArXG4gICAgICBjb2RlLnJlcGxhY2UoL1xcbiQvLCAnJykgK1xuICAgICAgJ1xcbicgKyBmZW5jZSArICdcXG5cXG4nXG4gICAgKVxuICB9XG59O1xuXG5ydWxlcy5ob3Jpem9udGFsUnVsZSA9IHtcbiAgZmlsdGVyOiAnaHInLFxuXG4gIHJlcGxhY2VtZW50OiBmdW5jdGlvbiAoY29udGVudCwgbm9kZSwgb3B0aW9ucykge1xuICAgIHJldHVybiAnXFxuXFxuJyArIG9wdGlvbnMuaHIgKyAnXFxuXFxuJ1xuICB9XG59O1xuXG5ydWxlcy5pbmxpbmVMaW5rID0ge1xuICBmaWx0ZXI6IGZ1bmN0aW9uIChub2RlLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIG9wdGlvbnMubGlua1N0eWxlID09PSAnaW5saW5lZCcgJiZcbiAgICAgIG5vZGUubm9kZU5hbWUgPT09ICdBJyAmJlxuICAgICAgbm9kZS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKVxuICAgIClcbiAgfSxcblxuICByZXBsYWNlbWVudDogZnVuY3Rpb24gKGNvbnRlbnQsIG5vZGUpIHtcbiAgICB2YXIgaHJlZiA9IG5vZGUuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG4gICAgaWYgKGhyZWYpIGhyZWYgPSBocmVmLnJlcGxhY2UoLyhbKCldKS9nLCAnXFxcXCQxJyk7XG4gICAgdmFyIHRpdGxlID0gY2xlYW5BdHRyaWJ1dGUobm9kZS5nZXRBdHRyaWJ1dGUoJ3RpdGxlJykpO1xuICAgIGlmICh0aXRsZSkgdGl0bGUgPSAnIFwiJyArIHRpdGxlLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKSArICdcIic7XG4gICAgcmV0dXJuICdbJyArIGNvbnRlbnQgKyAnXSgnICsgaHJlZiArIHRpdGxlICsgJyknXG4gIH1cbn07XG5cbnJ1bGVzLnJlZmVyZW5jZUxpbmsgPSB7XG4gIGZpbHRlcjogZnVuY3Rpb24gKG5vZGUsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gKFxuICAgICAgb3B0aW9ucy5saW5rU3R5bGUgPT09ICdyZWZlcmVuY2VkJyAmJlxuICAgICAgbm9kZS5ub2RlTmFtZSA9PT0gJ0EnICYmXG4gICAgICBub2RlLmdldEF0dHJpYnV0ZSgnaHJlZicpXG4gICAgKVxuICB9LFxuXG4gIHJlcGxhY2VtZW50OiBmdW5jdGlvbiAoY29udGVudCwgbm9kZSwgb3B0aW9ucykge1xuICAgIHZhciBocmVmID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcbiAgICB2YXIgdGl0bGUgPSBjbGVhbkF0dHJpYnV0ZShub2RlLmdldEF0dHJpYnV0ZSgndGl0bGUnKSk7XG4gICAgaWYgKHRpdGxlKSB0aXRsZSA9ICcgXCInICsgdGl0bGUgKyAnXCInO1xuICAgIHZhciByZXBsYWNlbWVudDtcbiAgICB2YXIgcmVmZXJlbmNlO1xuXG4gICAgc3dpdGNoIChvcHRpb25zLmxpbmtSZWZlcmVuY2VTdHlsZSkge1xuICAgICAgY2FzZSAnY29sbGFwc2VkJzpcbiAgICAgICAgcmVwbGFjZW1lbnQgPSAnWycgKyBjb250ZW50ICsgJ11bXSc7XG4gICAgICAgIHJlZmVyZW5jZSA9ICdbJyArIGNvbnRlbnQgKyAnXTogJyArIGhyZWYgKyB0aXRsZTtcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ3Nob3J0Y3V0JzpcbiAgICAgICAgcmVwbGFjZW1lbnQgPSAnWycgKyBjb250ZW50ICsgJ10nO1xuICAgICAgICByZWZlcmVuY2UgPSAnWycgKyBjb250ZW50ICsgJ106ICcgKyBocmVmICsgdGl0bGU7XG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB2YXIgaWQgPSB0aGlzLnJlZmVyZW5jZXMubGVuZ3RoICsgMTtcbiAgICAgICAgcmVwbGFjZW1lbnQgPSAnWycgKyBjb250ZW50ICsgJ11bJyArIGlkICsgJ10nO1xuICAgICAgICByZWZlcmVuY2UgPSAnWycgKyBpZCArICddOiAnICsgaHJlZiArIHRpdGxlO1xuICAgIH1cblxuICAgIHRoaXMucmVmZXJlbmNlcy5wdXNoKHJlZmVyZW5jZSk7XG4gICAgcmV0dXJuIHJlcGxhY2VtZW50XG4gIH0sXG5cbiAgcmVmZXJlbmNlczogW10sXG5cbiAgYXBwZW5kOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciByZWZlcmVuY2VzID0gJyc7XG4gICAgaWYgKHRoaXMucmVmZXJlbmNlcy5sZW5ndGgpIHtcbiAgICAgIHJlZmVyZW5jZXMgPSAnXFxuXFxuJyArIHRoaXMucmVmZXJlbmNlcy5qb2luKCdcXG4nKSArICdcXG5cXG4nO1xuICAgICAgdGhpcy5yZWZlcmVuY2VzID0gW107IC8vIFJlc2V0IHJlZmVyZW5jZXNcbiAgICB9XG4gICAgcmV0dXJuIHJlZmVyZW5jZXNcbiAgfVxufTtcblxucnVsZXMuZW1waGFzaXMgPSB7XG4gIGZpbHRlcjogWydlbScsICdpJ10sXG5cbiAgcmVwbGFjZW1lbnQ6IGZ1bmN0aW9uIChjb250ZW50LCBub2RlLCBvcHRpb25zKSB7XG4gICAgaWYgKCFjb250ZW50LnRyaW0oKSkgcmV0dXJuICcnXG4gICAgcmV0dXJuIG9wdGlvbnMuZW1EZWxpbWl0ZXIgKyBjb250ZW50ICsgb3B0aW9ucy5lbURlbGltaXRlclxuICB9XG59O1xuXG5ydWxlcy5zdHJvbmcgPSB7XG4gIGZpbHRlcjogWydzdHJvbmcnLCAnYiddLFxuXG4gIHJlcGxhY2VtZW50OiBmdW5jdGlvbiAoY29udGVudCwgbm9kZSwgb3B0aW9ucykge1xuICAgIGlmICghY29udGVudC50cmltKCkpIHJldHVybiAnJ1xuICAgIHJldHVybiBvcHRpb25zLnN0cm9uZ0RlbGltaXRlciArIGNvbnRlbnQgKyBvcHRpb25zLnN0cm9uZ0RlbGltaXRlclxuICB9XG59O1xuXG5ydWxlcy5jb2RlID0ge1xuICBmaWx0ZXI6IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgdmFyIGhhc1NpYmxpbmdzID0gbm9kZS5wcmV2aW91c1NpYmxpbmcgfHwgbm9kZS5uZXh0U2libGluZztcbiAgICB2YXIgaXNDb2RlQmxvY2sgPSBub2RlLnBhcmVudE5vZGUubm9kZU5hbWUgPT09ICdQUkUnICYmICFoYXNTaWJsaW5ncztcblxuICAgIHJldHVybiBub2RlLm5vZGVOYW1lID09PSAnQ09ERScgJiYgIWlzQ29kZUJsb2NrXG4gIH0sXG5cbiAgcmVwbGFjZW1lbnQ6IGZ1bmN0aW9uIChjb250ZW50KSB7XG4gICAgaWYgKCFjb250ZW50KSByZXR1cm4gJydcbiAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC9cXHI/XFxufFxcci9nLCAnICcpO1xuXG4gICAgdmFyIGV4dHJhU3BhY2UgPSAvXmB8XiAuKj9bXiBdLiogJHxgJC8udGVzdChjb250ZW50KSA/ICcgJyA6ICcnO1xuICAgIHZhciBkZWxpbWl0ZXIgPSAnYCc7XG4gICAgdmFyIG1hdGNoZXMgPSBjb250ZW50Lm1hdGNoKC9gKy9nbSkgfHwgW107XG4gICAgd2hpbGUgKG1hdGNoZXMuaW5kZXhPZihkZWxpbWl0ZXIpICE9PSAtMSkgZGVsaW1pdGVyID0gZGVsaW1pdGVyICsgJ2AnO1xuXG4gICAgcmV0dXJuIGRlbGltaXRlciArIGV4dHJhU3BhY2UgKyBjb250ZW50ICsgZXh0cmFTcGFjZSArIGRlbGltaXRlclxuICB9XG59O1xuXG5ydWxlcy5pbWFnZSA9IHtcbiAgZmlsdGVyOiAnaW1nJyxcblxuICByZXBsYWNlbWVudDogZnVuY3Rpb24gKGNvbnRlbnQsIG5vZGUpIHtcbiAgICB2YXIgYWx0ID0gY2xlYW5BdHRyaWJ1dGUobm9kZS5nZXRBdHRyaWJ1dGUoJ2FsdCcpKTtcbiAgICB2YXIgc3JjID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ3NyYycpIHx8ICcnO1xuICAgIHZhciB0aXRsZSA9IGNsZWFuQXR0cmlidXRlKG5vZGUuZ2V0QXR0cmlidXRlKCd0aXRsZScpKTtcbiAgICB2YXIgdGl0bGVQYXJ0ID0gdGl0bGUgPyAnIFwiJyArIHRpdGxlICsgJ1wiJyA6ICcnO1xuICAgIHJldHVybiBzcmMgPyAnIVsnICsgYWx0ICsgJ10nICsgJygnICsgc3JjICsgdGl0bGVQYXJ0ICsgJyknIDogJydcbiAgfVxufTtcblxuZnVuY3Rpb24gY2xlYW5BdHRyaWJ1dGUgKGF0dHJpYnV0ZSkge1xuICByZXR1cm4gYXR0cmlidXRlID8gYXR0cmlidXRlLnJlcGxhY2UoLyhcXG4rXFxzKikrL2csICdcXG4nKSA6ICcnXG59XG5cbi8qKlxuICogTWFuYWdlcyBhIGNvbGxlY3Rpb24gb2YgcnVsZXMgdXNlZCB0byBjb252ZXJ0IEhUTUwgdG8gTWFya2Rvd25cbiAqL1xuXG5mdW5jdGlvbiBSdWxlcyAob3B0aW9ucykge1xuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICB0aGlzLl9rZWVwID0gW107XG4gIHRoaXMuX3JlbW92ZSA9IFtdO1xuXG4gIHRoaXMuYmxhbmtSdWxlID0ge1xuICAgIHJlcGxhY2VtZW50OiBvcHRpb25zLmJsYW5rUmVwbGFjZW1lbnRcbiAgfTtcblxuICB0aGlzLmtlZXBSZXBsYWNlbWVudCA9IG9wdGlvbnMua2VlcFJlcGxhY2VtZW50O1xuXG4gIHRoaXMuZGVmYXVsdFJ1bGUgPSB7XG4gICAgcmVwbGFjZW1lbnQ6IG9wdGlvbnMuZGVmYXVsdFJlcGxhY2VtZW50XG4gIH07XG5cbiAgdGhpcy5hcnJheSA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb3B0aW9ucy5ydWxlcykgdGhpcy5hcnJheS5wdXNoKG9wdGlvbnMucnVsZXNba2V5XSk7XG59XG5cblJ1bGVzLnByb3RvdHlwZSA9IHtcbiAgYWRkOiBmdW5jdGlvbiAoa2V5LCBydWxlKSB7XG4gICAgdGhpcy5hcnJheS51bnNoaWZ0KHJ1bGUpO1xuICB9LFxuXG4gIGtlZXA6IGZ1bmN0aW9uIChmaWx0ZXIpIHtcbiAgICB0aGlzLl9rZWVwLnVuc2hpZnQoe1xuICAgICAgZmlsdGVyOiBmaWx0ZXIsXG4gICAgICByZXBsYWNlbWVudDogdGhpcy5rZWVwUmVwbGFjZW1lbnRcbiAgICB9KTtcbiAgfSxcblxuICByZW1vdmU6IGZ1bmN0aW9uIChmaWx0ZXIpIHtcbiAgICB0aGlzLl9yZW1vdmUudW5zaGlmdCh7XG4gICAgICBmaWx0ZXI6IGZpbHRlcixcbiAgICAgIHJlcGxhY2VtZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAnJ1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIGZvck5vZGU6IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgaWYgKG5vZGUuaXNCbGFuaykgcmV0dXJuIHRoaXMuYmxhbmtSdWxlXG4gICAgdmFyIHJ1bGU7XG5cbiAgICBpZiAoKHJ1bGUgPSBmaW5kUnVsZSh0aGlzLmFycmF5LCBub2RlLCB0aGlzLm9wdGlvbnMpKSkgcmV0dXJuIHJ1bGVcbiAgICBpZiAoKHJ1bGUgPSBmaW5kUnVsZSh0aGlzLl9rZWVwLCBub2RlLCB0aGlzLm9wdGlvbnMpKSkgcmV0dXJuIHJ1bGVcbiAgICBpZiAoKHJ1bGUgPSBmaW5kUnVsZSh0aGlzLl9yZW1vdmUsIG5vZGUsIHRoaXMub3B0aW9ucykpKSByZXR1cm4gcnVsZVxuXG4gICAgcmV0dXJuIHRoaXMuZGVmYXVsdFJ1bGVcbiAgfSxcblxuICBmb3JFYWNoOiBmdW5jdGlvbiAoZm4pIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYXJyYXkubGVuZ3RoOyBpKyspIGZuKHRoaXMuYXJyYXlbaV0sIGkpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBmaW5kUnVsZSAocnVsZXMsIG5vZGUsIG9wdGlvbnMpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBydWxlID0gcnVsZXNbaV07XG4gICAgaWYgKGZpbHRlclZhbHVlKHJ1bGUsIG5vZGUsIG9wdGlvbnMpKSByZXR1cm4gcnVsZVxuICB9XG4gIHJldHVybiB2b2lkIDBcbn1cblxuZnVuY3Rpb24gZmlsdGVyVmFsdWUgKHJ1bGUsIG5vZGUsIG9wdGlvbnMpIHtcbiAgdmFyIGZpbHRlciA9IHJ1bGUuZmlsdGVyO1xuICBpZiAodHlwZW9mIGZpbHRlciA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAoZmlsdGVyID09PSBub2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpIHJldHVybiB0cnVlXG4gIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShmaWx0ZXIpKSB7XG4gICAgaWYgKGZpbHRlci5pbmRleE9mKG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkgPiAtMSkgcmV0dXJuIHRydWVcbiAgfSBlbHNlIGlmICh0eXBlb2YgZmlsdGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKGZpbHRlci5jYWxsKHJ1bGUsIG5vZGUsIG9wdGlvbnMpKSByZXR1cm4gdHJ1ZVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2BmaWx0ZXJgIG5lZWRzIHRvIGJlIGEgc3RyaW5nLCBhcnJheSwgb3IgZnVuY3Rpb24nKVxuICB9XG59XG5cbi8qKlxuICogVGhlIGNvbGxhcHNlV2hpdGVzcGFjZSBmdW5jdGlvbiBpcyBhZGFwdGVkIGZyb20gY29sbGFwc2Utd2hpdGVzcGFjZVxuICogYnkgTHVjIFRoZXZlbmFyZC5cbiAqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgTHVjIFRoZXZlbmFyZCA8bHVjdGhldmVuYXJkQGdtYWlsLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogY29sbGFwc2VXaGl0ZXNwYWNlKG9wdGlvbnMpIHJlbW92ZXMgZXh0cmFuZW91cyB3aGl0ZXNwYWNlIGZyb20gYW4gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gY29sbGFwc2VXaGl0ZXNwYWNlIChvcHRpb25zKSB7XG4gIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICB2YXIgaXNCbG9jayA9IG9wdGlvbnMuaXNCbG9jaztcbiAgdmFyIGlzVm9pZCA9IG9wdGlvbnMuaXNWb2lkO1xuICB2YXIgaXNQcmUgPSBvcHRpb25zLmlzUHJlIHx8IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubm9kZU5hbWUgPT09ICdQUkUnXG4gIH07XG5cbiAgaWYgKCFlbGVtZW50LmZpcnN0Q2hpbGQgfHwgaXNQcmUoZWxlbWVudCkpIHJldHVyblxuXG4gIHZhciBwcmV2VGV4dCA9IG51bGw7XG4gIHZhciBrZWVwTGVhZGluZ1dzID0gZmFsc2U7XG5cbiAgdmFyIHByZXYgPSBudWxsO1xuICB2YXIgbm9kZSA9IG5leHQocHJldiwgZWxlbWVudCwgaXNQcmUpO1xuXG4gIHdoaWxlIChub2RlICE9PSBlbGVtZW50KSB7XG4gICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDMgfHwgbm9kZS5ub2RlVHlwZSA9PT0gNCkgeyAvLyBOb2RlLlRFWFRfTk9ERSBvciBOb2RlLkNEQVRBX1NFQ1RJT05fTk9ERVxuICAgICAgdmFyIHRleHQgPSBub2RlLmRhdGEucmVwbGFjZSgvWyBcXHJcXG5cXHRdKy9nLCAnICcpO1xuXG4gICAgICBpZiAoKCFwcmV2VGV4dCB8fCAvICQvLnRlc3QocHJldlRleHQuZGF0YSkpICYmXG4gICAgICAgICAgIWtlZXBMZWFkaW5nV3MgJiYgdGV4dFswXSA9PT0gJyAnKSB7XG4gICAgICAgIHRleHQgPSB0ZXh0LnN1YnN0cigxKTtcbiAgICAgIH1cblxuICAgICAgLy8gYHRleHRgIG1pZ2h0IGJlIGVtcHR5IGF0IHRoaXMgcG9pbnQuXG4gICAgICBpZiAoIXRleHQpIHtcbiAgICAgICAgbm9kZSA9IHJlbW92ZShub2RlKTtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgbm9kZS5kYXRhID0gdGV4dDtcblxuICAgICAgcHJldlRleHQgPSBub2RlO1xuICAgIH0gZWxzZSBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkgeyAvLyBOb2RlLkVMRU1FTlRfTk9ERVxuICAgICAgaWYgKGlzQmxvY2sobm9kZSkgfHwgbm9kZS5ub2RlTmFtZSA9PT0gJ0JSJykge1xuICAgICAgICBpZiAocHJldlRleHQpIHtcbiAgICAgICAgICBwcmV2VGV4dC5kYXRhID0gcHJldlRleHQuZGF0YS5yZXBsYWNlKC8gJC8sICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByZXZUZXh0ID0gbnVsbDtcbiAgICAgICAga2VlcExlYWRpbmdXcyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmIChpc1ZvaWQobm9kZSkgfHwgaXNQcmUobm9kZSkpIHtcbiAgICAgICAgLy8gQXZvaWQgdHJpbW1pbmcgc3BhY2UgYXJvdW5kIG5vbi1ibG9jaywgbm9uLUJSIHZvaWQgZWxlbWVudHMgYW5kIGlubGluZSBQUkUuXG4gICAgICAgIHByZXZUZXh0ID0gbnVsbDtcbiAgICAgICAga2VlcExlYWRpbmdXcyA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHByZXZUZXh0KSB7XG4gICAgICAgIC8vIERyb3AgcHJvdGVjdGlvbiBpZiBzZXQgcHJldmlvdXNseS5cbiAgICAgICAga2VlcExlYWRpbmdXcyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBub2RlID0gcmVtb3ZlKG5vZGUpO1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICB2YXIgbmV4dE5vZGUgPSBuZXh0KHByZXYsIG5vZGUsIGlzUHJlKTtcbiAgICBwcmV2ID0gbm9kZTtcbiAgICBub2RlID0gbmV4dE5vZGU7XG4gIH1cblxuICBpZiAocHJldlRleHQpIHtcbiAgICBwcmV2VGV4dC5kYXRhID0gcHJldlRleHQuZGF0YS5yZXBsYWNlKC8gJC8sICcnKTtcbiAgICBpZiAoIXByZXZUZXh0LmRhdGEpIHtcbiAgICAgIHJlbW92ZShwcmV2VGV4dCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogcmVtb3ZlKG5vZGUpIHJlbW92ZXMgdGhlIGdpdmVuIG5vZGUgZnJvbSB0aGUgRE9NIGFuZCByZXR1cm5zIHRoZVxuICogbmV4dCBub2RlIGluIHRoZSBzZXF1ZW5jZS5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAqIEByZXR1cm4ge05vZGV9IG5vZGVcbiAqL1xuZnVuY3Rpb24gcmVtb3ZlIChub2RlKSB7XG4gIHZhciBuZXh0ID0gbm9kZS5uZXh0U2libGluZyB8fCBub2RlLnBhcmVudE5vZGU7XG5cbiAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xuXG4gIHJldHVybiBuZXh0XG59XG5cbi8qKlxuICogbmV4dChwcmV2LCBjdXJyZW50LCBpc1ByZSkgcmV0dXJucyB0aGUgbmV4dCBub2RlIGluIHRoZSBzZXF1ZW5jZSwgZ2l2ZW4gdGhlXG4gKiBjdXJyZW50IGFuZCBwcmV2aW91cyBub2Rlcy5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IHByZXZcbiAqIEBwYXJhbSB7Tm9kZX0gY3VycmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXNQcmVcbiAqIEByZXR1cm4ge05vZGV9XG4gKi9cbmZ1bmN0aW9uIG5leHQgKHByZXYsIGN1cnJlbnQsIGlzUHJlKSB7XG4gIGlmICgocHJldiAmJiBwcmV2LnBhcmVudE5vZGUgPT09IGN1cnJlbnQpIHx8IGlzUHJlKGN1cnJlbnQpKSB7XG4gICAgcmV0dXJuIGN1cnJlbnQubmV4dFNpYmxpbmcgfHwgY3VycmVudC5wYXJlbnROb2RlXG4gIH1cblxuICByZXR1cm4gY3VycmVudC5maXJzdENoaWxkIHx8IGN1cnJlbnQubmV4dFNpYmxpbmcgfHwgY3VycmVudC5wYXJlbnROb2RlXG59XG5cbi8qXG4gKiBTZXQgdXAgd2luZG93IGZvciBOb2RlLmpzXG4gKi9cblxudmFyIHJvb3QgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB7fSk7XG5cbi8qXG4gKiBQYXJzaW5nIEhUTUwgc3RyaW5nc1xuICovXG5cbmZ1bmN0aW9uIGNhblBhcnNlSFRNTE5hdGl2ZWx5ICgpIHtcbiAgdmFyIFBhcnNlciA9IHJvb3QuRE9NUGFyc2VyO1xuICB2YXIgY2FuUGFyc2UgPSBmYWxzZTtcblxuICAvLyBBZGFwdGVkIGZyb20gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vMTEyOTAzMVxuICAvLyBGaXJlZm94L09wZXJhL0lFIHRocm93IGVycm9ycyBvbiB1bnN1cHBvcnRlZCB0eXBlc1xuICB0cnkge1xuICAgIC8vIFdlYktpdCByZXR1cm5zIG51bGwgb24gdW5zdXBwb3J0ZWQgdHlwZXNcbiAgICBpZiAobmV3IFBhcnNlcigpLnBhcnNlRnJvbVN0cmluZygnJywgJ3RleHQvaHRtbCcpKSB7XG4gICAgICBjYW5QYXJzZSA9IHRydWU7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7fVxuXG4gIHJldHVybiBjYW5QYXJzZVxufVxuXG5mdW5jdGlvbiBjcmVhdGVIVE1MUGFyc2VyICgpIHtcbiAgdmFyIFBhcnNlciA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gIHtcbiAgICBpZiAoc2hvdWxkVXNlQWN0aXZlWCgpKSB7XG4gICAgICBQYXJzZXIucHJvdG90eXBlLnBhcnNlRnJvbVN0cmluZyA9IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICAgICAgdmFyIGRvYyA9IG5ldyB3aW5kb3cuQWN0aXZlWE9iamVjdCgnaHRtbGZpbGUnKTtcbiAgICAgICAgZG9jLmRlc2lnbk1vZGUgPSAnb24nOyAvLyBkaXNhYmxlIG9uLXBhZ2Ugc2NyaXB0c1xuICAgICAgICBkb2Mub3BlbigpO1xuICAgICAgICBkb2Mud3JpdGUoc3RyaW5nKTtcbiAgICAgICAgZG9jLmNsb3NlKCk7XG4gICAgICAgIHJldHVybiBkb2NcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIFBhcnNlci5wcm90b3R5cGUucGFyc2VGcm9tU3RyaW5nID0gZnVuY3Rpb24gKHN0cmluZykge1xuICAgICAgICB2YXIgZG9jID0gZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KCcnKTtcbiAgICAgICAgZG9jLm9wZW4oKTtcbiAgICAgICAgZG9jLndyaXRlKHN0cmluZyk7XG4gICAgICAgIGRvYy5jbG9zZSgpO1xuICAgICAgICByZXR1cm4gZG9jXG4gICAgICB9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gUGFyc2VyXG59XG5cbmZ1bmN0aW9uIHNob3VsZFVzZUFjdGl2ZVggKCkge1xuICB2YXIgdXNlQWN0aXZlWCA9IGZhbHNlO1xuICB0cnkge1xuICAgIGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudCgnJykub3BlbigpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKHJvb3QuQWN0aXZlWE9iamVjdCkgdXNlQWN0aXZlWCA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIHVzZUFjdGl2ZVhcbn1cblxudmFyIEhUTUxQYXJzZXIgPSBjYW5QYXJzZUhUTUxOYXRpdmVseSgpID8gcm9vdC5ET01QYXJzZXIgOiBjcmVhdGVIVE1MUGFyc2VyKCk7XG5cbmZ1bmN0aW9uIFJvb3ROb2RlIChpbnB1dCwgb3B0aW9ucykge1xuICB2YXIgcm9vdDtcbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICB2YXIgZG9jID0gaHRtbFBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhcbiAgICAgIC8vIERPTSBwYXJzZXJzIGFycmFuZ2UgZWxlbWVudHMgaW4gdGhlIDxoZWFkPiBhbmQgPGJvZHk+LlxuICAgICAgLy8gV3JhcHBpbmcgaW4gYSBjdXN0b20gZWxlbWVudCBlbnN1cmVzIGVsZW1lbnRzIGFyZSByZWxpYWJseSBhcnJhbmdlZCBpblxuICAgICAgLy8gYSBzaW5nbGUgZWxlbWVudC5cbiAgICAgICc8eC10dXJuZG93biBpZD1cInR1cm5kb3duLXJvb3RcIj4nICsgaW5wdXQgKyAnPC94LXR1cm5kb3duPicsXG4gICAgICAndGV4dC9odG1sJ1xuICAgICk7XG4gICAgcm9vdCA9IGRvYy5nZXRFbGVtZW50QnlJZCgndHVybmRvd24tcm9vdCcpO1xuICB9IGVsc2Uge1xuICAgIHJvb3QgPSBpbnB1dC5jbG9uZU5vZGUodHJ1ZSk7XG4gIH1cbiAgY29sbGFwc2VXaGl0ZXNwYWNlKHtcbiAgICBlbGVtZW50OiByb290LFxuICAgIGlzQmxvY2s6IGlzQmxvY2ssXG4gICAgaXNWb2lkOiBpc1ZvaWQsXG4gICAgaXNQcmU6IG9wdGlvbnMucHJlZm9ybWF0dGVkQ29kZSA/IGlzUHJlT3JDb2RlIDogbnVsbFxuICB9KTtcblxuICByZXR1cm4gcm9vdFxufVxuXG52YXIgX2h0bWxQYXJzZXI7XG5mdW5jdGlvbiBodG1sUGFyc2VyICgpIHtcbiAgX2h0bWxQYXJzZXIgPSBfaHRtbFBhcnNlciB8fCBuZXcgSFRNTFBhcnNlcigpO1xuICByZXR1cm4gX2h0bWxQYXJzZXJcbn1cblxuZnVuY3Rpb24gaXNQcmVPckNvZGUgKG5vZGUpIHtcbiAgcmV0dXJuIG5vZGUubm9kZU5hbWUgPT09ICdQUkUnIHx8IG5vZGUubm9kZU5hbWUgPT09ICdDT0RFJ1xufVxuXG5mdW5jdGlvbiBOb2RlIChub2RlLCBvcHRpb25zKSB7XG4gIG5vZGUuaXNCbG9jayA9IGlzQmxvY2sobm9kZSk7XG4gIG5vZGUuaXNDb2RlID0gbm9kZS5ub2RlTmFtZSA9PT0gJ0NPREUnIHx8IG5vZGUucGFyZW50Tm9kZS5pc0NvZGU7XG4gIG5vZGUuaXNCbGFuayA9IGlzQmxhbmsobm9kZSk7XG4gIG5vZGUuZmxhbmtpbmdXaGl0ZXNwYWNlID0gZmxhbmtpbmdXaGl0ZXNwYWNlKG5vZGUsIG9wdGlvbnMpO1xuICByZXR1cm4gbm9kZVxufVxuXG5mdW5jdGlvbiBpc0JsYW5rIChub2RlKSB7XG4gIHJldHVybiAoXG4gICAgIWlzVm9pZChub2RlKSAmJlxuICAgICFpc01lYW5pbmdmdWxXaGVuQmxhbmsobm9kZSkgJiZcbiAgICAvXlxccyokL2kudGVzdChub2RlLnRleHRDb250ZW50KSAmJlxuICAgICFoYXNWb2lkKG5vZGUpICYmXG4gICAgIWhhc01lYW5pbmdmdWxXaGVuQmxhbmsobm9kZSlcbiAgKVxufVxuXG5mdW5jdGlvbiBmbGFua2luZ1doaXRlc3BhY2UgKG5vZGUsIG9wdGlvbnMpIHtcbiAgaWYgKG5vZGUuaXNCbG9jayB8fCAob3B0aW9ucy5wcmVmb3JtYXR0ZWRDb2RlICYmIG5vZGUuaXNDb2RlKSkge1xuICAgIHJldHVybiB7IGxlYWRpbmc6ICcnLCB0cmFpbGluZzogJycgfVxuICB9XG5cbiAgdmFyIGVkZ2VzID0gZWRnZVdoaXRlc3BhY2Uobm9kZS50ZXh0Q29udGVudCk7XG5cbiAgLy8gYWJhbmRvbiBsZWFkaW5nIEFTQ0lJIFdTIGlmIGxlZnQtZmxhbmtlZCBieSBBU0NJSSBXU1xuICBpZiAoZWRnZXMubGVhZGluZ0FzY2lpICYmIGlzRmxhbmtlZEJ5V2hpdGVzcGFjZSgnbGVmdCcsIG5vZGUsIG9wdGlvbnMpKSB7XG4gICAgZWRnZXMubGVhZGluZyA9IGVkZ2VzLmxlYWRpbmdOb25Bc2NpaTtcbiAgfVxuXG4gIC8vIGFiYW5kb24gdHJhaWxpbmcgQVNDSUkgV1MgaWYgcmlnaHQtZmxhbmtlZCBieSBBU0NJSSBXU1xuICBpZiAoZWRnZXMudHJhaWxpbmdBc2NpaSAmJiBpc0ZsYW5rZWRCeVdoaXRlc3BhY2UoJ3JpZ2h0Jywgbm9kZSwgb3B0aW9ucykpIHtcbiAgICBlZGdlcy50cmFpbGluZyA9IGVkZ2VzLnRyYWlsaW5nTm9uQXNjaWk7XG4gIH1cblxuICByZXR1cm4geyBsZWFkaW5nOiBlZGdlcy5sZWFkaW5nLCB0cmFpbGluZzogZWRnZXMudHJhaWxpbmcgfVxufVxuXG5mdW5jdGlvbiBlZGdlV2hpdGVzcGFjZSAoc3RyaW5nKSB7XG4gIHZhciBtID0gc3RyaW5nLm1hdGNoKC9eKChbIFxcdFxcclxcbl0qKShcXHMqKSkoPzooPz1cXFMpW1xcc1xcU10qXFxTKT8oKFxccyo/KShbIFxcdFxcclxcbl0qKSkkLyk7XG4gIHJldHVybiB7XG4gICAgbGVhZGluZzogbVsxXSwgLy8gd2hvbGUgc3RyaW5nIGZvciB3aGl0ZXNwYWNlLW9ubHkgc3RyaW5nc1xuICAgIGxlYWRpbmdBc2NpaTogbVsyXSxcbiAgICBsZWFkaW5nTm9uQXNjaWk6IG1bM10sXG4gICAgdHJhaWxpbmc6IG1bNF0sIC8vIGVtcHR5IGZvciB3aGl0ZXNwYWNlLW9ubHkgc3RyaW5nc1xuICAgIHRyYWlsaW5nTm9uQXNjaWk6IG1bNV0sXG4gICAgdHJhaWxpbmdBc2NpaTogbVs2XVxuICB9XG59XG5cbmZ1bmN0aW9uIGlzRmxhbmtlZEJ5V2hpdGVzcGFjZSAoc2lkZSwgbm9kZSwgb3B0aW9ucykge1xuICB2YXIgc2libGluZztcbiAgdmFyIHJlZ0V4cDtcbiAgdmFyIGlzRmxhbmtlZDtcblxuICBpZiAoc2lkZSA9PT0gJ2xlZnQnKSB7XG4gICAgc2libGluZyA9IG5vZGUucHJldmlvdXNTaWJsaW5nO1xuICAgIHJlZ0V4cCA9IC8gJC87XG4gIH0gZWxzZSB7XG4gICAgc2libGluZyA9IG5vZGUubmV4dFNpYmxpbmc7XG4gICAgcmVnRXhwID0gL14gLztcbiAgfVxuXG4gIGlmIChzaWJsaW5nKSB7XG4gICAgaWYgKHNpYmxpbmcubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgIGlzRmxhbmtlZCA9IHJlZ0V4cC50ZXN0KHNpYmxpbmcubm9kZVZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMucHJlZm9ybWF0dGVkQ29kZSAmJiBzaWJsaW5nLm5vZGVOYW1lID09PSAnQ09ERScpIHtcbiAgICAgIGlzRmxhbmtlZCA9IGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoc2libGluZy5ub2RlVHlwZSA9PT0gMSAmJiAhaXNCbG9jayhzaWJsaW5nKSkge1xuICAgICAgaXNGbGFua2VkID0gcmVnRXhwLnRlc3Qoc2libGluZy50ZXh0Q29udGVudCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBpc0ZsYW5rZWRcbn1cblxudmFyIHJlZHVjZSA9IEFycmF5LnByb3RvdHlwZS5yZWR1Y2U7XG52YXIgZXNjYXBlcyA9IFtcbiAgWy9cXFxcL2csICdcXFxcXFxcXCddLFxuICBbL1xcKi9nLCAnXFxcXConXSxcbiAgWy9eLS9nLCAnXFxcXC0nXSxcbiAgWy9eXFwrIC9nLCAnXFxcXCsgJ10sXG4gIFsvXig9KykvZywgJ1xcXFwkMSddLFxuICBbL14oI3sxLDZ9KSAvZywgJ1xcXFwkMSAnXSxcbiAgWy9gL2csICdcXFxcYCddLFxuICBbL15+fn4vZywgJ1xcXFx+fn4nXSxcbiAgWy9cXFsvZywgJ1xcXFxbJ10sXG4gIFsvXFxdL2csICdcXFxcXSddLFxuICBbL14+L2csICdcXFxcPiddLFxuICBbL18vZywgJ1xcXFxfJ10sXG4gIFsvXihcXGQrKVxcLiAvZywgJyQxXFxcXC4gJ11cbl07XG5cbmZ1bmN0aW9uIFR1cm5kb3duU2VydmljZSAob3B0aW9ucykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVHVybmRvd25TZXJ2aWNlKSkgcmV0dXJuIG5ldyBUdXJuZG93blNlcnZpY2Uob3B0aW9ucylcblxuICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgcnVsZXM6IHJ1bGVzLFxuICAgIGhlYWRpbmdTdHlsZTogJ3NldGV4dCcsXG4gICAgaHI6ICcqICogKicsXG4gICAgYnVsbGV0TGlzdE1hcmtlcjogJyonLFxuICAgIGNvZGVCbG9ja1N0eWxlOiAnaW5kZW50ZWQnLFxuICAgIGZlbmNlOiAnYGBgJyxcbiAgICBlbURlbGltaXRlcjogJ18nLFxuICAgIHN0cm9uZ0RlbGltaXRlcjogJyoqJyxcbiAgICBsaW5rU3R5bGU6ICdpbmxpbmVkJyxcbiAgICBsaW5rUmVmZXJlbmNlU3R5bGU6ICdmdWxsJyxcbiAgICBicjogJyAgJyxcbiAgICBwcmVmb3JtYXR0ZWRDb2RlOiBmYWxzZSxcbiAgICBibGFua1JlcGxhY2VtZW50OiBmdW5jdGlvbiAoY29udGVudCwgbm9kZSkge1xuICAgICAgcmV0dXJuIG5vZGUuaXNCbG9jayA/ICdcXG5cXG4nIDogJydcbiAgICB9LFxuICAgIGtlZXBSZXBsYWNlbWVudDogZnVuY3Rpb24gKGNvbnRlbnQsIG5vZGUpIHtcbiAgICAgIHJldHVybiBub2RlLmlzQmxvY2sgPyAnXFxuXFxuJyArIG5vZGUub3V0ZXJIVE1MICsgJ1xcblxcbicgOiBub2RlLm91dGVySFRNTFxuICAgIH0sXG4gICAgZGVmYXVsdFJlcGxhY2VtZW50OiBmdW5jdGlvbiAoY29udGVudCwgbm9kZSkge1xuICAgICAgcmV0dXJuIG5vZGUuaXNCbG9jayA/ICdcXG5cXG4nICsgY29udGVudCArICdcXG5cXG4nIDogY29udGVudFxuICAgIH1cbiAgfTtcbiAgdGhpcy5vcHRpb25zID0gZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG4gIHRoaXMucnVsZXMgPSBuZXcgUnVsZXModGhpcy5vcHRpb25zKTtcbn1cblxuVHVybmRvd25TZXJ2aWNlLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqIFRoZSBlbnRyeSBwb2ludCBmb3IgY29udmVydGluZyBhIHN0cmluZyBvciBET00gbm9kZSB0byBNYXJrZG93blxuICAgKiBAcHVibGljXG4gICAqIEBwYXJhbSB7U3RyaW5nfEhUTUxFbGVtZW50fSBpbnB1dCBUaGUgc3RyaW5nIG9yIERPTSBub2RlIHRvIGNvbnZlcnRcbiAgICogQHJldHVybnMgQSBNYXJrZG93biByZXByZXNlbnRhdGlvbiBvZiB0aGUgaW5wdXRcbiAgICogQHR5cGUgU3RyaW5nXG4gICAqL1xuXG4gIHR1cm5kb3duOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICBpZiAoIWNhbkNvbnZlcnQoaW5wdXQpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICBpbnB1dCArICcgaXMgbm90IGEgc3RyaW5nLCBvciBhbiBlbGVtZW50L2RvY3VtZW50L2ZyYWdtZW50IG5vZGUuJ1xuICAgICAgKVxuICAgIH1cblxuICAgIGlmIChpbnB1dCA9PT0gJycpIHJldHVybiAnJ1xuXG4gICAgdmFyIG91dHB1dCA9IHByb2Nlc3MuY2FsbCh0aGlzLCBuZXcgUm9vdE5vZGUoaW5wdXQsIHRoaXMub3B0aW9ucykpO1xuICAgIHJldHVybiBwb3N0UHJvY2Vzcy5jYWxsKHRoaXMsIG91dHB1dClcbiAgfSxcblxuICAvKipcbiAgICogQWRkIG9uZSBvciBtb3JlIHBsdWdpbnNcbiAgICogQHB1YmxpY1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufEFycmF5fSBwbHVnaW4gVGhlIHBsdWdpbiBvciBhcnJheSBvZiBwbHVnaW5zIHRvIGFkZFxuICAgKiBAcmV0dXJucyBUaGUgVHVybmRvd24gaW5zdGFuY2UgZm9yIGNoYWluaW5nXG4gICAqIEB0eXBlIE9iamVjdFxuICAgKi9cblxuICB1c2U6IGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShwbHVnaW4pKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBsdWdpbi5sZW5ndGg7IGkrKykgdGhpcy51c2UocGx1Z2luW2ldKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwbHVnaW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHBsdWdpbih0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigncGx1Z2luIG11c3QgYmUgYSBGdW5jdGlvbiBvciBhbiBBcnJheSBvZiBGdW5jdGlvbnMnKVxuICAgIH1cbiAgICByZXR1cm4gdGhpc1xuICB9LFxuXG4gIC8qKlxuICAgKiBBZGRzIGEgcnVsZVxuICAgKiBAcHVibGljXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgVGhlIHVuaXF1ZSBrZXkgb2YgdGhlIHJ1bGVcbiAgICogQHBhcmFtIHtPYmplY3R9IHJ1bGUgVGhlIHJ1bGVcbiAgICogQHJldHVybnMgVGhlIFR1cm5kb3duIGluc3RhbmNlIGZvciBjaGFpbmluZ1xuICAgKiBAdHlwZSBPYmplY3RcbiAgICovXG5cbiAgYWRkUnVsZTogZnVuY3Rpb24gKGtleSwgcnVsZSkge1xuICAgIHRoaXMucnVsZXMuYWRkKGtleSwgcnVsZSk7XG4gICAgcmV0dXJuIHRoaXNcbiAgfSxcblxuICAvKipcbiAgICogS2VlcCBhIG5vZGUgKGFzIEhUTUwpIHRoYXQgbWF0Y2hlcyB0aGUgZmlsdGVyXG4gICAqIEBwdWJsaWNcbiAgICogQHBhcmFtIHtTdHJpbmd8QXJyYXl8RnVuY3Rpb259IGZpbHRlciBUaGUgdW5pcXVlIGtleSBvZiB0aGUgcnVsZVxuICAgKiBAcmV0dXJucyBUaGUgVHVybmRvd24gaW5zdGFuY2UgZm9yIGNoYWluaW5nXG4gICAqIEB0eXBlIE9iamVjdFxuICAgKi9cblxuICBrZWVwOiBmdW5jdGlvbiAoZmlsdGVyKSB7XG4gICAgdGhpcy5ydWxlcy5rZWVwKGZpbHRlcik7XG4gICAgcmV0dXJuIHRoaXNcbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlIGEgbm9kZSB0aGF0IG1hdGNoZXMgdGhlIGZpbHRlclxuICAgKiBAcHVibGljXG4gICAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fEZ1bmN0aW9ufSBmaWx0ZXIgVGhlIHVuaXF1ZSBrZXkgb2YgdGhlIHJ1bGVcbiAgICogQHJldHVybnMgVGhlIFR1cm5kb3duIGluc3RhbmNlIGZvciBjaGFpbmluZ1xuICAgKiBAdHlwZSBPYmplY3RcbiAgICovXG5cbiAgcmVtb3ZlOiBmdW5jdGlvbiAoZmlsdGVyKSB7XG4gICAgdGhpcy5ydWxlcy5yZW1vdmUoZmlsdGVyKTtcbiAgICByZXR1cm4gdGhpc1xuICB9LFxuXG4gIC8qKlxuICAgKiBFc2NhcGVzIE1hcmtkb3duIHN5bnRheFxuICAgKiBAcHVibGljXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmcgVGhlIHN0cmluZyB0byBlc2NhcGVcbiAgICogQHJldHVybnMgQSBzdHJpbmcgd2l0aCBNYXJrZG93biBzeW50YXggZXNjYXBlZFxuICAgKiBAdHlwZSBTdHJpbmdcbiAgICovXG5cbiAgZXNjYXBlOiBmdW5jdGlvbiAoc3RyaW5nKSB7XG4gICAgcmV0dXJuIGVzY2FwZXMucmVkdWNlKGZ1bmN0aW9uIChhY2N1bXVsYXRvciwgZXNjYXBlKSB7XG4gICAgICByZXR1cm4gYWNjdW11bGF0b3IucmVwbGFjZShlc2NhcGVbMF0sIGVzY2FwZVsxXSlcbiAgICB9LCBzdHJpbmcpXG4gIH1cbn07XG5cbi8qKlxuICogUmVkdWNlcyBhIERPTSBub2RlIGRvd24gdG8gaXRzIE1hcmtkb3duIHN0cmluZyBlcXVpdmFsZW50XG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gcGFyZW50Tm9kZSBUaGUgbm9kZSB0byBjb252ZXJ0XG4gKiBAcmV0dXJucyBBIE1hcmtkb3duIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBub2RlXG4gKiBAdHlwZSBTdHJpbmdcbiAqL1xuXG5mdW5jdGlvbiBwcm9jZXNzIChwYXJlbnROb2RlKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgcmV0dXJuIHJlZHVjZS5jYWxsKHBhcmVudE5vZGUuY2hpbGROb2RlcywgZnVuY3Rpb24gKG91dHB1dCwgbm9kZSkge1xuICAgIG5vZGUgPSBuZXcgTm9kZShub2RlLCBzZWxmLm9wdGlvbnMpO1xuXG4gICAgdmFyIHJlcGxhY2VtZW50ID0gJyc7XG4gICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgIHJlcGxhY2VtZW50ID0gbm9kZS5pc0NvZGUgPyBub2RlLm5vZGVWYWx1ZSA6IHNlbGYuZXNjYXBlKG5vZGUubm9kZVZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgIHJlcGxhY2VtZW50ID0gcmVwbGFjZW1lbnRGb3JOb2RlLmNhbGwoc2VsZiwgbm9kZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGpvaW4ob3V0cHV0LCByZXBsYWNlbWVudClcbiAgfSwgJycpXG59XG5cbi8qKlxuICogQXBwZW5kcyBzdHJpbmdzIGFzIGVhY2ggcnVsZSByZXF1aXJlcyBhbmQgdHJpbXMgdGhlIG91dHB1dFxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBvdXRwdXQgVGhlIGNvbnZlcnNpb24gb3V0cHV0XG4gKiBAcmV0dXJucyBBIHRyaW1tZWQgdmVyc2lvbiBvZiB0aGUgb3VwdXRcbiAqIEB0eXBlIFN0cmluZ1xuICovXG5cbmZ1bmN0aW9uIHBvc3RQcm9jZXNzIChvdXRwdXQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLnJ1bGVzLmZvckVhY2goZnVuY3Rpb24gKHJ1bGUpIHtcbiAgICBpZiAodHlwZW9mIHJ1bGUuYXBwZW5kID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvdXRwdXQgPSBqb2luKG91dHB1dCwgcnVsZS5hcHBlbmQoc2VsZi5vcHRpb25zKSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gb3V0cHV0LnJlcGxhY2UoL15bXFx0XFxyXFxuXSsvLCAnJykucmVwbGFjZSgvW1xcdFxcclxcblxcc10rJC8sICcnKVxufVxuXG4vKipcbiAqIENvbnZlcnRzIGFuIGVsZW1lbnQgbm9kZSB0byBpdHMgTWFya2Rvd24gZXF1aXZhbGVudFxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG5vZGUgVGhlIG5vZGUgdG8gY29udmVydFxuICogQHJldHVybnMgQSBNYXJrZG93biByZXByZXNlbnRhdGlvbiBvZiB0aGUgbm9kZVxuICogQHR5cGUgU3RyaW5nXG4gKi9cblxuZnVuY3Rpb24gcmVwbGFjZW1lbnRGb3JOb2RlIChub2RlKSB7XG4gIHZhciBydWxlID0gdGhpcy5ydWxlcy5mb3JOb2RlKG5vZGUpO1xuICB2YXIgY29udGVudCA9IHByb2Nlc3MuY2FsbCh0aGlzLCBub2RlKTtcbiAgdmFyIHdoaXRlc3BhY2UgPSBub2RlLmZsYW5raW5nV2hpdGVzcGFjZTtcbiAgaWYgKHdoaXRlc3BhY2UubGVhZGluZyB8fCB3aGl0ZXNwYWNlLnRyYWlsaW5nKSBjb250ZW50ID0gY29udGVudC50cmltKCk7XG4gIHJldHVybiAoXG4gICAgd2hpdGVzcGFjZS5sZWFkaW5nICtcbiAgICBydWxlLnJlcGxhY2VtZW50KGNvbnRlbnQsIG5vZGUsIHRoaXMub3B0aW9ucykgK1xuICAgIHdoaXRlc3BhY2UudHJhaWxpbmdcbiAgKVxufVxuXG4vKipcbiAqIEpvaW5zIHJlcGxhY2VtZW50IHRvIHRoZSBjdXJyZW50IG91dHB1dCB3aXRoIGFwcHJvcHJpYXRlIG51bWJlciBvZiBuZXcgbGluZXNcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gb3V0cHV0IFRoZSBjdXJyZW50IGNvbnZlcnNpb24gb3V0cHV0XG4gKiBAcGFyYW0ge1N0cmluZ30gcmVwbGFjZW1lbnQgVGhlIHN0cmluZyB0byBhcHBlbmQgdG8gdGhlIG91dHB1dFxuICogQHJldHVybnMgSm9pbmVkIG91dHB1dFxuICogQHR5cGUgU3RyaW5nXG4gKi9cblxuZnVuY3Rpb24gam9pbiAob3V0cHV0LCByZXBsYWNlbWVudCkge1xuICB2YXIgczEgPSB0cmltVHJhaWxpbmdOZXdsaW5lcyhvdXRwdXQpO1xuICB2YXIgczIgPSB0cmltTGVhZGluZ05ld2xpbmVzKHJlcGxhY2VtZW50KTtcbiAgdmFyIG5scyA9IE1hdGgubWF4KG91dHB1dC5sZW5ndGggLSBzMS5sZW5ndGgsIHJlcGxhY2VtZW50Lmxlbmd0aCAtIHMyLmxlbmd0aCk7XG4gIHZhciBzZXBhcmF0b3IgPSAnXFxuXFxuJy5zdWJzdHJpbmcoMCwgbmxzKTtcblxuICByZXR1cm4gczEgKyBzZXBhcmF0b3IgKyBzMlxufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciBhbiBpbnB1dCBjYW4gYmUgY29udmVydGVkXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtTdHJpbmd8SFRNTEVsZW1lbnR9IGlucHV0IERlc2NyaWJlIHRoaXMgcGFyYW1ldGVyXG4gKiBAcmV0dXJucyBEZXNjcmliZSB3aGF0IGl0IHJldHVybnNcbiAqIEB0eXBlIFN0cmluZ3xPYmplY3R8QXJyYXl8Qm9vbGVhbnxOdW1iZXJcbiAqL1xuXG5mdW5jdGlvbiBjYW5Db252ZXJ0IChpbnB1dCkge1xuICByZXR1cm4gKFxuICAgIGlucHV0ICE9IG51bGwgJiYgKFxuICAgICAgdHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJyB8fFxuICAgICAgKGlucHV0Lm5vZGVUeXBlICYmIChcbiAgICAgICAgaW5wdXQubm9kZVR5cGUgPT09IDEgfHwgaW5wdXQubm9kZVR5cGUgPT09IDkgfHwgaW5wdXQubm9kZVR5cGUgPT09IDExXG4gICAgICApKVxuICAgIClcbiAgKVxufVxuXG5leHBvcnQgZGVmYXVsdCBUdXJuZG93blNlcnZpY2U7XG4iLCJpbXBvcnQgeyBSZWFkYWJpbGl0eSB9IGZyb20gJ0Btb3ppbGxhL3JlYWRhYmlsaXR5JztcbmltcG9ydCBUdXJuZG93blNlcnZpY2UgZnJvbSAndHVybmRvd24nO1xuaW1wb3J0IHR5cGUgeyBQYWdlQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC90eXBlcyc7XG5cbmNvbnN0IHR1cm5kb3duU2VydmljZSA9IG5ldyBUdXJuZG93blNlcnZpY2Uoe1xuICBoZWFkaW5nU3R5bGU6ICdhdHgnLFxuICBjb2RlQmxvY2tTdHlsZTogJ2ZlbmNlZCcsXG59KTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RQYWdlQ29udGVudCgpOiBQcm9taXNlPFBhZ2VDb250ZXh0PiB7XG4gIGNvbnN0IGRvY3VtZW50Q2xvbmUgPSBkb2N1bWVudC5jbG9uZU5vZGUodHJ1ZSkgYXMgRG9jdW1lbnQ7XG4gIGNvbnN0IHJlYWRlciA9IG5ldyBSZWFkYWJpbGl0eShkb2N1bWVudENsb25lKTtcbiAgY29uc3QgYXJ0aWNsZSA9IHJlYWRlci5wYXJzZSgpO1xuXG4gIGlmICghYXJ0aWNsZSkge1xuICAgIHJldHVybiB7XG4gICAgICB0aXRsZTogZG9jdW1lbnQudGl0bGUsXG4gICAgICB1cmw6IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuICAgICAgbWFya2Rvd246IGRvY3VtZW50LmJvZHkuaW5uZXJUZXh0LnNsaWNlKDAsIDgwMDApLFxuICAgICAgd29yZENvdW50OiBkb2N1bWVudC5ib2R5LmlubmVyVGV4dC5zcGxpdCgvXFxzKy8pLmxlbmd0aCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgbWFya2Rvd24gPSB0dXJuZG93blNlcnZpY2UudHVybmRvd24oYXJ0aWNsZS5jb250ZW50KTtcblxuICByZXR1cm4ge1xuICAgIHRpdGxlOiBhcnRpY2xlLnRpdGxlLFxuICAgIHVybDogd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgbWFya2Rvd24sXG4gICAgd29yZENvdW50OiBhcnRpY2xlLmxlbmd0aCxcbiAgICBzaXRlTmFtZTogYXJ0aWNsZS5zaXRlTmFtZSB8fCB1bmRlZmluZWQsXG4gIH07XG59XG4iLCJpbXBvcnQgdHlwZSB7IEltYWdlQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC90eXBlcyc7XG5cbmZ1bmN0aW9uIGlzQ29udGVudEltYWdlKGltZzogSFRNTEltYWdlRWxlbWVudCk6IGJvb2xlYW4ge1xuICBjb25zdCB7IHdpZHRoLCBoZWlnaHQsIHNyYyB9ID0gaW1nO1xuICBpZiAod2lkdGggPCAxMDAgfHwgaGVpZ2h0IDwgMTAwKSByZXR1cm4gZmFsc2U7XG5cbiAgY29uc3Qgc2tpcFBhdHRlcm5zID0gWydhdmF0YXInLCAnbG9nbycsICdpY29uJywgJ2Vtb2ppJywgJ2JhZGdlJywgJ2J1dHRvbiddO1xuICByZXR1cm4gIXNraXBQYXR0ZXJucy5zb21lKHBhdHRlcm4gPT4gc3JjLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocGF0dGVybikpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjb21wcmVzc0FuZEVuY29kZShpbWc6IEhUTUxJbWFnZUVsZW1lbnQpOiBQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKSE7XG5cbiAgICBjb25zdCBtYXhTaXplID0gMTAyNDtcbiAgICBsZXQgeyB3aWR0aCwgaGVpZ2h0IH0gPSBpbWc7XG5cbiAgICBpZiAod2lkdGggPiBtYXhTaXplIHx8IGhlaWdodCA+IG1heFNpemUpIHtcbiAgICAgIGlmICh3aWR0aCA+IGhlaWdodCkge1xuICAgICAgICBoZWlnaHQgPSAoaGVpZ2h0IC8gd2lkdGgpICogbWF4U2l6ZTtcbiAgICAgICAgd2lkdGggPSBtYXhTaXplO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2lkdGggPSAod2lkdGggLyBoZWlnaHQpICogbWF4U2l6ZTtcbiAgICAgICAgaGVpZ2h0ID0gbWF4U2l6ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcblxuICAgIHJlc29sdmUoY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvanBlZycsIDAuODUpKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHRyYWN0SW1hZ2VzKGVuYWJsZWQ6IGJvb2xlYW4pOiBQcm9taXNlPEltYWdlQ29udGV4dFtdPiB7XG4gIGlmICghZW5hYmxlZCkgcmV0dXJuIFtdO1xuXG4gIGNvbnN0IGFydGljbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdhcnRpY2xlJykgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWFpbicpIHx8IGRvY3VtZW50LmJvZHk7XG4gIGNvbnN0IGltZ3MgPSBBcnJheS5mcm9tKGFydGljbGUucXVlcnlTZWxlY3RvckFsbCgnaW1nJykpO1xuXG4gIGNvbnN0IHZhbGlkSW1hZ2VzID0gaW1ncy5maWx0ZXIoaXNDb250ZW50SW1hZ2UpLnNsaWNlKDAsIDUpO1xuXG4gIGNvbnN0IHJlc3VsdHM6IEltYWdlQ29udGV4dFtdID0gW107XG4gIGZvciAoY29uc3QgaW1nIG9mIHZhbGlkSW1hZ2VzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGJhc2U2NCA9IGF3YWl0IGNvbXByZXNzQW5kRW5jb2RlKGltZyk7XG4gICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICBhbHQ6IGltZy5hbHQgfHwgaW1nLnRpdGxlIHx8ICcnLFxuICAgICAgICBiYXNlNjQsXG4gICAgICAgIHBvc2l0aW9uOiByZXN1bHRzLmxlbmd0aFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gcHJvY2VzcyBpbWFnZTonLCBlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0cztcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBpbmplY3RUcmFuc2xhdGlvbihlbGVtZW50OiBIVE1MRWxlbWVudCwgdHJhbnNsYXRpb246IHN0cmluZykge1xuICBjb25zdCB3cmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHdyYXBwZXIuY2xhc3NOYW1lID0gJ2NhbGNpZmVyLXRyYW5zbGF0aW9uLXdyYXBwZXInO1xuXG4gIGNvbnN0IHNoYWRvdyA9IHdyYXBwZXIuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xuXG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4gICAgLnRyYW5zbGF0aW9uIHtcbiAgICAgIGNvbG9yOiAjOWNhM2FmO1xuICAgICAgZm9udC1zaXplOiAwLjllbTtcbiAgICAgIG1hcmdpbi10b3A6IDRweDtcbiAgICAgIHBhZGRpbmctbGVmdDogOHB4O1xuICAgICAgYm9yZGVyLWxlZnQ6IDJweCBzb2xpZCAjZjk3MzE2O1xuICAgICAgb3BhY2l0eTogMDtcbiAgICAgIGFuaW1hdGlvbjogZmFkZUluIDAuM3MgZm9yd2FyZHM7XG4gICAgfVxuICAgIEBrZXlmcmFtZXMgZmFkZUluIHtcbiAgICAgIHRvIHsgb3BhY2l0eTogMTsgfVxuICAgIH1cbiAgYDtcblxuICBjb25zdCB0cmFuc2xhdGlvbkVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICB0cmFuc2xhdGlvbkVsLmNsYXNzTmFtZSA9ICd0cmFuc2xhdGlvbic7XG4gIHRyYW5zbGF0aW9uRWwudGV4dENvbnRlbnQgPSB0cmFuc2xhdGlvbjtcblxuICBzaGFkb3cuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICBzaGFkb3cuYXBwZW5kQ2hpbGQodHJhbnNsYXRpb25FbCk7XG5cbiAgZWxlbWVudC5pbnNlcnRBZGphY2VudEVsZW1lbnQoJ2FmdGVyZW5kJywgd3JhcHBlcik7XG5cbiAgcmV0dXJuIHRyYW5zbGF0aW9uRWw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGVhclRyYW5zbGF0aW9ucygpIHtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmNhbGNpZmVyLXRyYW5zbGF0aW9uLXdyYXBwZXInKS5mb3JFYWNoKGVsID0+IGVsLnJlbW92ZSgpKTtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZWxlY3Rpb25Ub29sYmFyKCkge1xuICBsZXQgdG9vbGJhcjogSFRNTERpdkVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKCkgPT4ge1xuICAgIGNvbnN0IHNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcbiAgICBjb25zdCB0ZXh0ID0gc2VsZWN0aW9uPy50b1N0cmluZygpLnRyaW0oKTtcblxuICAgIGlmICh0b29sYmFyKSB7XG4gICAgICB0b29sYmFyLnJlbW92ZSgpO1xuICAgICAgdG9vbGJhciA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKCF0ZXh0IHx8IHRleHQubGVuZ3RoIDwgMykgcmV0dXJuO1xuXG4gICAgY29uc3QgcmFuZ2UgPSBzZWxlY3Rpb24hLmdldFJhbmdlQXQoMCk7XG4gICAgY29uc3QgcmVjdCA9IHJhbmdlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgdG9vbGJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRvb2xiYXIuY2xhc3NOYW1lID0gJ2NhbGNpZmVyLXNlbGVjdGlvbi10b29sYmFyJztcblxuICAgIGNvbnN0IHNoYWRvdyA9IHRvb2xiYXIuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xuXG4gICAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIHN0eWxlLnRleHRDb250ZW50ID0gYFxuICAgICAgLnRvb2xiYXIge1xuICAgICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICAgIHRvcDogJHtyZWN0LnRvcCAtIDQ1fXB4O1xuICAgICAgICBsZWZ0OiAke3JlY3QubGVmdH1weDtcbiAgICAgICAgYmFja2dyb3VuZDogIzFmMjkzNztcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgIzM3NDE1MTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNnB4O1xuICAgICAgICBwYWRkaW5nOiA0cHg7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGdhcDogNHB4O1xuICAgICAgICBib3gtc2hhZG93OiAwIDRweCA2cHggcmdiYSgwLDAsMCwwLjMpO1xuICAgICAgICB6LWluZGV4OiA5OTk5OTk7XG4gICAgICB9XG4gICAgICBidXR0b24ge1xuICAgICAgICBwYWRkaW5nOiA2cHggMTJweDtcbiAgICAgICAgYmFja2dyb3VuZDogIzM3NDE1MTtcbiAgICAgICAgY29sb3I6IHdoaXRlO1xuICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICB9XG4gICAgICBidXR0b246aG92ZXIge1xuICAgICAgICBiYWNrZ3JvdW5kOiAjNGI1NTYzO1xuICAgICAgfVxuICAgIGA7XG5cbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250YWluZXIuY2xhc3NOYW1lID0gJ3Rvb2xiYXInO1xuXG4gICAgY29uc3QgYnV0dG9ucyA9IFtcbiAgICAgIHsgdGV4dDogJ0FzayBBSScsIGFjdGlvbjogKCkgPT4gb3BlblNpZGVQYW5lbFdpdGhUZXh0KHRleHQsICdhc2snKSB9LFxuICAgICAgeyB0ZXh0OiAnVHJhbnNsYXRlJywgYWN0aW9uOiAoKSA9PiBvcGVuU2lkZVBhbmVsV2l0aFRleHQodGV4dCwgJ3RyYW5zbGF0ZScpIH0sXG4gICAgICB7IHRleHQ6ICdFeHBsYWluJywgYWN0aW9uOiAoKSA9PiBvcGVuU2lkZVBhbmVsV2l0aFRleHQodGV4dCwgJ2V4cGxhaW4nKSB9XG4gICAgXTtcblxuICAgIGJ1dHRvbnMuZm9yRWFjaCgoeyB0ZXh0OiBidG5UZXh0LCBhY3Rpb24gfSkgPT4ge1xuICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICBidG4udGV4dENvbnRlbnQgPSBidG5UZXh0O1xuICAgICAgYnRuLm9uY2xpY2sgPSBhY3Rpb247XG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoYnRuKTtcbiAgICB9KTtcblxuICAgIHNoYWRvdy5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgc2hhZG93LmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0b29sYmFyKTtcbiAgfSk7XG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGUpID0+IHtcbiAgICBpZiAodG9vbGJhciAmJiAhdG9vbGJhci5jb250YWlucyhlLnRhcmdldCBhcyBOb2RlKSkge1xuICAgICAgdG9vbGJhci5yZW1vdmUoKTtcbiAgICAgIHRvb2xiYXIgPSBudWxsO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG9wZW5TaWRlUGFuZWxXaXRoVGV4dCh0ZXh0OiBzdHJpbmcsIGFjdGlvbjogc3RyaW5nKSB7XG4gIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICB0eXBlOiAnT1BFTl9TSURFUEFORUxfV0lUSF9URVhUJyxcbiAgICB0ZXh0LFxuICAgIGFjdGlvblxuICB9KTtcbn1cbiIsImltcG9ydCB7IGV4dHJhY3RQYWdlQ29udGVudCB9IGZyb20gJy4vZXh0cmFjdG9yL3RleHQnO1xuaW1wb3J0IHsgZXh0cmFjdEltYWdlcyB9IGZyb20gJy4vZXh0cmFjdG9yL2ltYWdlJztcbmltcG9ydCB7IGluamVjdFRyYW5zbGF0aW9uIH0gZnJvbSAnLi90cmFuc2xhdG9yL3JlbmRlcmVyJztcbmltcG9ydCB7IGNyZWF0ZVNlbGVjdGlvblRvb2xiYXIgfSBmcm9tICcuL3NlbGVjdGlvbi90b29sYmFyJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29udGVudFNjcmlwdCh7XG4gIG1hdGNoZXM6IFsnPGFsbF91cmxzPiddLFxuICBtYWluKCkge1xuICAgIGNvbnNvbGUubG9nKCdDYWxjaWZlciBjb250ZW50IHNjcmlwdCBsb2FkZWQnKTtcblxuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgnZmVhdHVyZUZsYWdzJywgKHJlc3VsdCkgPT4ge1xuICAgICAgaWYgKHJlc3VsdC5mZWF0dXJlRmxhZ3M/LnNlbGVjdGlvblRvb2xiYXIpIHtcbiAgICAgICAgY3JlYXRlU2VsZWN0aW9uVG9vbGJhcigpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICAgICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ0VYVFJBQ1RfUEFHRScpIHtcbiAgICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgICBjb25zdCBwYWdlQ29udGV4dCA9IGF3YWl0IGV4dHJhY3RQYWdlQ29udGVudCgpO1xuICAgICAgICAgIGNvbnN0IGltYWdlcyA9IGF3YWl0IGV4dHJhY3RJbWFnZXMobWVzc2FnZS5pbWFnZU1vZGUgfHwgZmFsc2UpO1xuICAgICAgICAgIHNlbmRSZXNwb25zZSh7IC4uLnBhZ2VDb250ZXh0LCBpbWFnZXMgfSk7XG4gICAgICAgIH0pKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAobWVzc2FnZS50eXBlID09PSAnVFJBTlNMQVRFX1BBR0UnKSB7XG4gICAgICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgYXJ0aWNsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2FydGljbGUnKSB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJykgfHwgZG9jdW1lbnQuYm9keTtcbiAgICAgICAgICBjb25zdCBlbGVtZW50cyA9IGFydGljbGUucXVlcnlTZWxlY3RvckFsbCgncCwgaDEsIGgyLCBoMywgaDQsIGg1LCBoNiwgbGknKTtcblxuICAgICAgICAgIGZvciAoY29uc3QgZWwgb2YgQXJyYXkuZnJvbShlbGVtZW50cykpIHtcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSAoZWwgYXMgSFRNTEVsZW1lbnQpLnRleHRDb250ZW50Py50cmltKCk7XG4gICAgICAgICAgICBpZiAoIXRleHQgfHwgdGV4dC5sZW5ndGggPCAxMCkgY29udGludWU7XG5cbiAgICAgICAgICAgIGNvbnN0IHBvcnQgPSBjaHJvbWUucnVudGltZS5jb25uZWN0KHsgbmFtZTogJ3RyYW5zbGF0ZS1zdHJlYW0nIH0pO1xuICAgICAgICAgICAgbGV0IHRyYW5zbGF0aW9uID0gJyc7XG4gICAgICAgICAgICBsZXQgdHJhbnNsYXRpb25FbDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICAgICAgICAgICAgcG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgIHR5cGU6ICdUUkFOU0xBVEUnLFxuICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgICB0YXJnZXRMYW5nOiBtZXNzYWdlLnRhcmdldExhbmdcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBwb3J0Lm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobXNnKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChtc2cudHlwZSA9PT0gJ0NIVU5LJykge1xuICAgICAgICAgICAgICAgIHRyYW5zbGF0aW9uICs9IG1zZy5jaHVuaztcbiAgICAgICAgICAgICAgICBpZiAoIXRyYW5zbGF0aW9uRWwpIHtcbiAgICAgICAgICAgICAgICAgIHRyYW5zbGF0aW9uRWwgPSBpbmplY3RUcmFuc2xhdGlvbihlbCBhcyBIVE1MRWxlbWVudCwgdHJhbnNsYXRpb24pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB0cmFuc2xhdGlvbkVsLnRleHRDb250ZW50ID0gdHJhbnNsYXRpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1zZy50eXBlID09PSAnRE9ORScpIHtcbiAgICAgICAgICAgICAgICBwb3J0LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDApKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICB9KSgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbn0pO1xuIiwiZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSAoXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcbiAgZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZCA9PSBudWxsID8gZ2xvYmFsVGhpcy5jaHJvbWUgOiAoXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvclxuICAgIGdsb2JhbFRoaXMuYnJvd3NlclxuICApXG4pO1xuIiwiZnVuY3Rpb24gcHJpbnQobWV0aG9kLCAuLi5hcmdzKSB7XG4gIGlmIChpbXBvcnQubWV0YS5lbnYuTU9ERSA9PT0gXCJwcm9kdWN0aW9uXCIpIHJldHVybjtcbiAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSBcInN0cmluZ1wiKSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGFyZ3Muc2hpZnQoKTtcbiAgICBtZXRob2QoYFt3eHRdICR7bWVzc2FnZX1gLCAuLi5hcmdzKTtcbiAgfSBlbHNlIHtcbiAgICBtZXRob2QoXCJbd3h0XVwiLCAuLi5hcmdzKTtcbiAgfVxufVxuZXhwb3J0IGNvbnN0IGxvZ2dlciA9IHtcbiAgZGVidWc6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmRlYnVnLCAuLi5hcmdzKSxcbiAgbG9nOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5sb2csIC4uLmFyZ3MpLFxuICB3YXJuOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS53YXJuLCAuLi5hcmdzKSxcbiAgZXJyb3I6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmVycm9yLCAuLi5hcmdzKVxufTtcbiIsImltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbmV4cG9ydCBjbGFzcyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50IGV4dGVuZHMgRXZlbnQge1xuICBjb25zdHJ1Y3RvcihuZXdVcmwsIG9sZFVybCkge1xuICAgIHN1cGVyKFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQuRVZFTlRfTkFNRSwge30pO1xuICAgIHRoaXMubmV3VXJsID0gbmV3VXJsO1xuICAgIHRoaXMub2xkVXJsID0gb2xkVXJsO1xuICB9XG4gIHN0YXRpYyBFVkVOVF9OQU1FID0gZ2V0VW5pcXVlRXZlbnROYW1lKFwid3h0OmxvY2F0aW9uY2hhbmdlXCIpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldFVuaXF1ZUV2ZW50TmFtZShldmVudE5hbWUpIHtcbiAgcmV0dXJuIGAke2Jyb3dzZXI/LnJ1bnRpbWU/LmlkfToke2ltcG9ydC5tZXRhLmVudi5FTlRSWVBPSU5UfToke2V2ZW50TmFtZX1gO1xufVxuIiwiaW1wb3J0IHsgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCB9IGZyb20gXCIuL2N1c3RvbS1ldmVudHMubWpzXCI7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTG9jYXRpb25XYXRjaGVyKGN0eCkge1xuICBsZXQgaW50ZXJ2YWw7XG4gIGxldCBvbGRVcmw7XG4gIHJldHVybiB7XG4gICAgLyoqXG4gICAgICogRW5zdXJlIHRoZSBsb2NhdGlvbiB3YXRjaGVyIGlzIGFjdGl2ZWx5IGxvb2tpbmcgZm9yIFVSTCBjaGFuZ2VzLiBJZiBpdCdzIGFscmVhZHkgd2F0Y2hpbmcsXG4gICAgICogdGhpcyBpcyBhIG5vb3AuXG4gICAgICovXG4gICAgcnVuKCkge1xuICAgICAgaWYgKGludGVydmFsICE9IG51bGwpIHJldHVybjtcbiAgICAgIG9sZFVybCA9IG5ldyBVUkwobG9jYXRpb24uaHJlZik7XG4gICAgICBpbnRlcnZhbCA9IGN0eC5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgIGxldCBuZXdVcmwgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuICAgICAgICBpZiAobmV3VXJsLmhyZWYgIT09IG9sZFVybC5ocmVmKSB7XG4gICAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQobmV3VXJsLCBvbGRVcmwpKTtcbiAgICAgICAgICBvbGRVcmwgPSBuZXdVcmw7XG4gICAgICAgIH1cbiAgICAgIH0sIDFlMyk7XG4gICAgfVxuICB9O1xufVxuIiwiaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gXCJ3eHQvYnJvd3NlclwiO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSBcIi4uLy4uL3NhbmRib3gvdXRpbHMvbG9nZ2VyLm1qc1wiO1xuaW1wb3J0IHsgZ2V0VW5pcXVlRXZlbnROYW1lIH0gZnJvbSBcIi4vY3VzdG9tLWV2ZW50cy5tanNcIjtcbmltcG9ydCB7IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlciB9IGZyb20gXCIuL2xvY2F0aW9uLXdhdGNoZXIubWpzXCI7XG5leHBvcnQgY2xhc3MgQ29udGVudFNjcmlwdENvbnRleHQge1xuICBjb25zdHJ1Y3Rvcihjb250ZW50U2NyaXB0TmFtZSwgb3B0aW9ucykge1xuICAgIHRoaXMuY29udGVudFNjcmlwdE5hbWUgPSBjb250ZW50U2NyaXB0TmFtZTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuYWJvcnRDb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGlmICh0aGlzLmlzVG9wRnJhbWUpIHtcbiAgICAgIHRoaXMubGlzdGVuRm9yTmV3ZXJTY3JpcHRzKHsgaWdub3JlRmlyc3RFdmVudDogdHJ1ZSB9KTtcbiAgICAgIHRoaXMuc3RvcE9sZFNjcmlwdHMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5saXN0ZW5Gb3JOZXdlclNjcmlwdHMoKTtcbiAgICB9XG4gIH1cbiAgc3RhdGljIFNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcbiAgICBcInd4dDpjb250ZW50LXNjcmlwdC1zdGFydGVkXCJcbiAgKTtcbiAgaXNUb3BGcmFtZSA9IHdpbmRvdy5zZWxmID09PSB3aW5kb3cudG9wO1xuICBhYm9ydENvbnRyb2xsZXI7XG4gIGxvY2F0aW9uV2F0Y2hlciA9IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlcih0aGlzKTtcbiAgcmVjZWl2ZWRNZXNzYWdlSWRzID0gLyogQF9fUFVSRV9fICovIG5ldyBTZXQoKTtcbiAgZ2V0IHNpZ25hbCgpIHtcbiAgICByZXR1cm4gdGhpcy5hYm9ydENvbnRyb2xsZXIuc2lnbmFsO1xuICB9XG4gIGFib3J0KHJlYXNvbikge1xuICAgIHJldHVybiB0aGlzLmFib3J0Q29udHJvbGxlci5hYm9ydChyZWFzb24pO1xuICB9XG4gIGdldCBpc0ludmFsaWQoKSB7XG4gICAgaWYgKGJyb3dzZXIucnVudGltZS5pZCA9PSBudWxsKSB7XG4gICAgICB0aGlzLm5vdGlmeUludmFsaWRhdGVkKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnNpZ25hbC5hYm9ydGVkO1xuICB9XG4gIGdldCBpc1ZhbGlkKCkge1xuICAgIHJldHVybiAhdGhpcy5pc0ludmFsaWQ7XG4gIH1cbiAgLyoqXG4gICAqIEFkZCBhIGxpc3RlbmVyIHRoYXQgaXMgY2FsbGVkIHdoZW4gdGhlIGNvbnRlbnQgc2NyaXB0J3MgY29udGV4dCBpcyBpbnZhbGlkYXRlZC5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVyLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKGNiKTtcbiAgICogY29uc3QgcmVtb3ZlSW52YWxpZGF0ZWRMaXN0ZW5lciA9IGN0eC5vbkludmFsaWRhdGVkKCgpID0+IHtcbiAgICogICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLnJlbW92ZUxpc3RlbmVyKGNiKTtcbiAgICogfSlcbiAgICogLy8gLi4uXG4gICAqIHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIoKTtcbiAgICovXG4gIG9uSW52YWxpZGF0ZWQoY2IpIHtcbiAgICB0aGlzLnNpZ25hbC5hZGRFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgY2IpO1xuICAgIHJldHVybiAoKSA9PiB0aGlzLnNpZ25hbC5yZW1vdmVFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgY2IpO1xuICB9XG4gIC8qKlxuICAgKiBSZXR1cm4gYSBwcm9taXNlIHRoYXQgbmV2ZXIgcmVzb2x2ZXMuIFVzZWZ1bCBpZiB5b3UgaGF2ZSBhbiBhc3luYyBmdW5jdGlvbiB0aGF0IHNob3VsZG4ndCBydW5cbiAgICogYWZ0ZXIgdGhlIGNvbnRleHQgaXMgZXhwaXJlZC5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogY29uc3QgZ2V0VmFsdWVGcm9tU3RvcmFnZSA9IGFzeW5jICgpID0+IHtcbiAgICogICBpZiAoY3R4LmlzSW52YWxpZCkgcmV0dXJuIGN0eC5ibG9jaygpO1xuICAgKlxuICAgKiAgIC8vIC4uLlxuICAgKiB9XG4gICAqL1xuICBibG9jaygpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKCkgPT4ge1xuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnNldEludGVydmFsYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbCB3aGVuIGludmFsaWRhdGVkLlxuICAgKi9cbiAgc2V0SW50ZXJ2YWwoaGFuZGxlciwgdGltZW91dCkge1xuICAgIGNvbnN0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNWYWxpZCkgaGFuZGxlcigpO1xuICAgIH0sIHRpbWVvdXQpO1xuICAgIHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjbGVhckludGVydmFsKGlkKSk7XG4gICAgcmV0dXJuIGlkO1xuICB9XG4gIC8qKlxuICAgKiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnNldFRpbWVvdXRgIHRoYXQgYXV0b21hdGljYWxseSBjbGVhcnMgdGhlIGludGVydmFsIHdoZW4gaW52YWxpZGF0ZWQuXG4gICAqL1xuICBzZXRUaW1lb3V0KGhhbmRsZXIsIHRpbWVvdXQpIHtcbiAgICBjb25zdCBpZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNWYWxpZCkgaGFuZGxlcigpO1xuICAgIH0sIHRpbWVvdXQpO1xuICAgIHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjbGVhclRpbWVvdXQoaWQpKTtcbiAgICByZXR1cm4gaWQ7XG4gIH1cbiAgLyoqXG4gICAqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2FuY2VscyB0aGUgcmVxdWVzdCB3aGVuXG4gICAqIGludmFsaWRhdGVkLlxuICAgKi9cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNhbGxiYWNrKSB7XG4gICAgY29uc3QgaWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKC4uLmFyZ3MpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzVmFsaWQpIGNhbGxiYWNrKC4uLmFyZ3MpO1xuICAgIH0pO1xuICAgIHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjYW5jZWxBbmltYXRpb25GcmFtZShpZCkpO1xuICAgIHJldHVybiBpZDtcbiAgfVxuICAvKipcbiAgICogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5yZXF1ZXN0SWRsZUNhbGxiYWNrYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2FuY2VscyB0aGUgcmVxdWVzdCB3aGVuXG4gICAqIGludmFsaWRhdGVkLlxuICAgKi9cbiAgcmVxdWVzdElkbGVDYWxsYmFjayhjYWxsYmFjaywgb3B0aW9ucykge1xuICAgIGNvbnN0IGlkID0gcmVxdWVzdElkbGVDYWxsYmFjaygoLi4uYXJncykgPT4ge1xuICAgICAgaWYgKCF0aGlzLnNpZ25hbC5hYm9ydGVkKSBjYWxsYmFjayguLi5hcmdzKTtcbiAgICB9LCBvcHRpb25zKTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsSWRsZUNhbGxiYWNrKGlkKSk7XG4gICAgcmV0dXJuIGlkO1xuICB9XG4gIGFkZEV2ZW50TGlzdGVuZXIodGFyZ2V0LCB0eXBlLCBoYW5kbGVyLCBvcHRpb25zKSB7XG4gICAgaWYgKHR5cGUgPT09IFwid3h0OmxvY2F0aW9uY2hhbmdlXCIpIHtcbiAgICAgIGlmICh0aGlzLmlzVmFsaWQpIHRoaXMubG9jYXRpb25XYXRjaGVyLnJ1bigpO1xuICAgIH1cbiAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcj8uKFxuICAgICAgdHlwZS5zdGFydHNXaXRoKFwid3h0OlwiKSA/IGdldFVuaXF1ZUV2ZW50TmFtZSh0eXBlKSA6IHR5cGUsXG4gICAgICBoYW5kbGVyLFxuICAgICAge1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICBzaWduYWw6IHRoaXMuc2lnbmFsXG4gICAgICB9XG4gICAgKTtcbiAgfVxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqIEFib3J0IHRoZSBhYm9ydCBjb250cm9sbGVyIGFuZCBleGVjdXRlIGFsbCBgb25JbnZhbGlkYXRlZGAgbGlzdGVuZXJzLlxuICAgKi9cbiAgbm90aWZ5SW52YWxpZGF0ZWQoKSB7XG4gICAgdGhpcy5hYm9ydChcIkNvbnRlbnQgc2NyaXB0IGNvbnRleHQgaW52YWxpZGF0ZWRcIik7XG4gICAgbG9nZ2VyLmRlYnVnKFxuICAgICAgYENvbnRlbnQgc2NyaXB0IFwiJHt0aGlzLmNvbnRlbnRTY3JpcHROYW1lfVwiIGNvbnRleHQgaW52YWxpZGF0ZWRgXG4gICAgKTtcbiAgfVxuICBzdG9wT2xkU2NyaXB0cygpIHtcbiAgICB3aW5kb3cucG9zdE1lc3NhZ2UoXG4gICAgICB7XG4gICAgICAgIHR5cGU6IENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSxcbiAgICAgICAgY29udGVudFNjcmlwdE5hbWU6IHRoaXMuY29udGVudFNjcmlwdE5hbWUsXG4gICAgICAgIG1lc3NhZ2VJZDogTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMilcbiAgICAgIH0sXG4gICAgICBcIipcIlxuICAgICk7XG4gIH1cbiAgdmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSB7XG4gICAgY29uc3QgaXNTY3JpcHRTdGFydGVkRXZlbnQgPSBldmVudC5kYXRhPy50eXBlID09PSBDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEU7XG4gICAgY29uc3QgaXNTYW1lQ29udGVudFNjcmlwdCA9IGV2ZW50LmRhdGE/LmNvbnRlbnRTY3JpcHROYW1lID09PSB0aGlzLmNvbnRlbnRTY3JpcHROYW1lO1xuICAgIGNvbnN0IGlzTm90RHVwbGljYXRlID0gIXRoaXMucmVjZWl2ZWRNZXNzYWdlSWRzLmhhcyhldmVudC5kYXRhPy5tZXNzYWdlSWQpO1xuICAgIHJldHVybiBpc1NjcmlwdFN0YXJ0ZWRFdmVudCAmJiBpc1NhbWVDb250ZW50U2NyaXB0ICYmIGlzTm90RHVwbGljYXRlO1xuICB9XG4gIGxpc3RlbkZvck5ld2VyU2NyaXB0cyhvcHRpb25zKSB7XG4gICAgbGV0IGlzRmlyc3QgPSB0cnVlO1xuICAgIGNvbnN0IGNiID0gKGV2ZW50KSA9PiB7XG4gICAgICBpZiAodGhpcy52ZXJpZnlTY3JpcHRTdGFydGVkRXZlbnQoZXZlbnQpKSB7XG4gICAgICAgIHRoaXMucmVjZWl2ZWRNZXNzYWdlSWRzLmFkZChldmVudC5kYXRhLm1lc3NhZ2VJZCk7XG4gICAgICAgIGNvbnN0IHdhc0ZpcnN0ID0gaXNGaXJzdDtcbiAgICAgICAgaXNGaXJzdCA9IGZhbHNlO1xuICAgICAgICBpZiAod2FzRmlyc3QgJiYgb3B0aW9ucz8uaWdub3JlRmlyc3RFdmVudCkgcmV0dXJuO1xuICAgICAgICB0aGlzLm5vdGlmeUludmFsaWRhdGVkKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBhZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBjYik7XG4gICAgdGhpcy5vbkludmFsaWRhdGVkKCgpID0+IHJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGNiKSk7XG4gIH1cbn1cbiIsImNvbnN0IG51bGxLZXkgPSBTeW1ib2woJ251bGwnKTsgLy8gYG9iamVjdEhhc2hlc2Aga2V5IGZvciBudWxsXG5cbmxldCBrZXlDb3VudGVyID0gMDtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWFueUtleXNNYXAgZXh0ZW5kcyBNYXAge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcigpO1xuXG5cdFx0dGhpcy5fb2JqZWN0SGFzaGVzID0gbmV3IFdlYWtNYXAoKTtcblx0XHR0aGlzLl9zeW1ib2xIYXNoZXMgPSBuZXcgTWFwKCk7IC8vIGh0dHBzOi8vZ2l0aHViLmNvbS90YzM5L2VjbWEyNjIvaXNzdWVzLzExOTRcblx0XHR0aGlzLl9wdWJsaWNLZXlzID0gbmV3IE1hcCgpO1xuXG5cdFx0Y29uc3QgW3BhaXJzXSA9IGFyZ3VtZW50czsgLy8gTWFwIGNvbXBhdFxuXHRcdGlmIChwYWlycyA9PT0gbnVsbCB8fCBwYWlycyA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBwYWlyc1tTeW1ib2wuaXRlcmF0b3JdICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKHR5cGVvZiBwYWlycyArICcgaXMgbm90IGl0ZXJhYmxlIChjYW5ub3QgcmVhZCBwcm9wZXJ0eSBTeW1ib2woU3ltYm9sLml0ZXJhdG9yKSknKTtcblx0XHR9XG5cblx0XHRmb3IgKGNvbnN0IFtrZXlzLCB2YWx1ZV0gb2YgcGFpcnMpIHtcblx0XHRcdHRoaXMuc2V0KGtleXMsIHZhbHVlKTtcblx0XHR9XG5cdH1cblxuXHRfZ2V0UHVibGljS2V5cyhrZXlzLCBjcmVhdGUgPSBmYWxzZSkge1xuXHRcdGlmICghQXJyYXkuaXNBcnJheShrZXlzKSkge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIGtleXMgcGFyYW1ldGVyIG11c3QgYmUgYW4gYXJyYXknKTtcblx0XHR9XG5cblx0XHRjb25zdCBwcml2YXRlS2V5ID0gdGhpcy5fZ2V0UHJpdmF0ZUtleShrZXlzLCBjcmVhdGUpO1xuXG5cdFx0bGV0IHB1YmxpY0tleTtcblx0XHRpZiAocHJpdmF0ZUtleSAmJiB0aGlzLl9wdWJsaWNLZXlzLmhhcyhwcml2YXRlS2V5KSkge1xuXHRcdFx0cHVibGljS2V5ID0gdGhpcy5fcHVibGljS2V5cy5nZXQocHJpdmF0ZUtleSk7XG5cdFx0fSBlbHNlIGlmIChjcmVhdGUpIHtcblx0XHRcdHB1YmxpY0tleSA9IFsuLi5rZXlzXTsgLy8gUmVnZW5lcmF0ZSBrZXlzIGFycmF5IHRvIGF2b2lkIGV4dGVybmFsIGludGVyYWN0aW9uXG5cdFx0XHR0aGlzLl9wdWJsaWNLZXlzLnNldChwcml2YXRlS2V5LCBwdWJsaWNLZXkpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7cHJpdmF0ZUtleSwgcHVibGljS2V5fTtcblx0fVxuXG5cdF9nZXRQcml2YXRlS2V5KGtleXMsIGNyZWF0ZSA9IGZhbHNlKSB7XG5cdFx0Y29uc3QgcHJpdmF0ZUtleXMgPSBbXTtcblx0XHRmb3IgKGxldCBrZXkgb2Yga2V5cykge1xuXHRcdFx0aWYgKGtleSA9PT0gbnVsbCkge1xuXHRcdFx0XHRrZXkgPSBudWxsS2V5O1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBoYXNoZXMgPSB0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyB8fCB0eXBlb2Yga2V5ID09PSAnZnVuY3Rpb24nID8gJ19vYmplY3RIYXNoZXMnIDogKHR5cGVvZiBrZXkgPT09ICdzeW1ib2wnID8gJ19zeW1ib2xIYXNoZXMnIDogZmFsc2UpO1xuXG5cdFx0XHRpZiAoIWhhc2hlcykge1xuXHRcdFx0XHRwcml2YXRlS2V5cy5wdXNoKGtleSk7XG5cdFx0XHR9IGVsc2UgaWYgKHRoaXNbaGFzaGVzXS5oYXMoa2V5KSkge1xuXHRcdFx0XHRwcml2YXRlS2V5cy5wdXNoKHRoaXNbaGFzaGVzXS5nZXQoa2V5KSk7XG5cdFx0XHR9IGVsc2UgaWYgKGNyZWF0ZSkge1xuXHRcdFx0XHRjb25zdCBwcml2YXRlS2V5ID0gYEBAbWttLXJlZi0ke2tleUNvdW50ZXIrK31AQGA7XG5cdFx0XHRcdHRoaXNbaGFzaGVzXS5zZXQoa2V5LCBwcml2YXRlS2V5KTtcblx0XHRcdFx0cHJpdmF0ZUtleXMucHVzaChwcml2YXRlS2V5KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkocHJpdmF0ZUtleXMpO1xuXHR9XG5cblx0c2V0KGtleXMsIHZhbHVlKSB7XG5cdFx0Y29uc3Qge3B1YmxpY0tleX0gPSB0aGlzLl9nZXRQdWJsaWNLZXlzKGtleXMsIHRydWUpO1xuXHRcdHJldHVybiBzdXBlci5zZXQocHVibGljS2V5LCB2YWx1ZSk7XG5cdH1cblxuXHRnZXQoa2V5cykge1xuXHRcdGNvbnN0IHtwdWJsaWNLZXl9ID0gdGhpcy5fZ2V0UHVibGljS2V5cyhrZXlzKTtcblx0XHRyZXR1cm4gc3VwZXIuZ2V0KHB1YmxpY0tleSk7XG5cdH1cblxuXHRoYXMoa2V5cykge1xuXHRcdGNvbnN0IHtwdWJsaWNLZXl9ID0gdGhpcy5fZ2V0UHVibGljS2V5cyhrZXlzKTtcblx0XHRyZXR1cm4gc3VwZXIuaGFzKHB1YmxpY0tleSk7XG5cdH1cblxuXHRkZWxldGUoa2V5cykge1xuXHRcdGNvbnN0IHtwdWJsaWNLZXksIHByaXZhdGVLZXl9ID0gdGhpcy5fZ2V0UHVibGljS2V5cyhrZXlzKTtcblx0XHRyZXR1cm4gQm9vbGVhbihwdWJsaWNLZXkgJiYgc3VwZXIuZGVsZXRlKHB1YmxpY0tleSkgJiYgdGhpcy5fcHVibGljS2V5cy5kZWxldGUocHJpdmF0ZUtleSkpO1xuXHR9XG5cblx0Y2xlYXIoKSB7XG5cdFx0c3VwZXIuY2xlYXIoKTtcblx0XHR0aGlzLl9zeW1ib2xIYXNoZXMuY2xlYXIoKTtcblx0XHR0aGlzLl9wdWJsaWNLZXlzLmNsZWFyKCk7XG5cdH1cblxuXHRnZXQgW1N5bWJvbC50b1N0cmluZ1RhZ10oKSB7XG5cdFx0cmV0dXJuICdNYW55S2V5c01hcCc7XG5cdH1cblxuXHRnZXQgc2l6ZSgpIHtcblx0XHRyZXR1cm4gc3VwZXIuc2l6ZTtcblx0fVxufVxuIiwiaW1wb3J0IE1hbnlLZXlzTWFwIGZyb20gJ21hbnkta2V5cy1tYXAnO1xuaW1wb3J0IHsgZGVmdSB9IGZyb20gJ2RlZnUnO1xuaW1wb3J0IHsgaXNFeGlzdCB9IGZyb20gJy4vZGV0ZWN0b3JzLm1qcyc7XG5cbmNvbnN0IGdldERlZmF1bHRPcHRpb25zID0gKCkgPT4gKHtcbiAgdGFyZ2V0OiBnbG9iYWxUaGlzLmRvY3VtZW50LFxuICB1bmlmeVByb2Nlc3M6IHRydWUsXG4gIGRldGVjdG9yOiBpc0V4aXN0LFxuICBvYnNlcnZlQ29uZmlnczoge1xuICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICBzdWJ0cmVlOiB0cnVlLFxuICAgIGF0dHJpYnV0ZXM6IHRydWVcbiAgfSxcbiAgc2lnbmFsOiB2b2lkIDAsXG4gIGN1c3RvbU1hdGNoZXI6IHZvaWQgMFxufSk7XG5jb25zdCBtZXJnZU9wdGlvbnMgPSAodXNlclNpZGVPcHRpb25zLCBkZWZhdWx0T3B0aW9ucykgPT4ge1xuICByZXR1cm4gZGVmdSh1c2VyU2lkZU9wdGlvbnMsIGRlZmF1bHRPcHRpb25zKTtcbn07XG5cbmNvbnN0IHVuaWZ5Q2FjaGUgPSBuZXcgTWFueUtleXNNYXAoKTtcbmZ1bmN0aW9uIGNyZWF0ZVdhaXRFbGVtZW50KGluc3RhbmNlT3B0aW9ucykge1xuICBjb25zdCB7IGRlZmF1bHRPcHRpb25zIH0gPSBpbnN0YW5jZU9wdGlvbnM7XG4gIHJldHVybiAoc2VsZWN0b3IsIG9wdGlvbnMpID0+IHtcbiAgICBjb25zdCB7XG4gICAgICB0YXJnZXQsXG4gICAgICB1bmlmeVByb2Nlc3MsXG4gICAgICBvYnNlcnZlQ29uZmlncyxcbiAgICAgIGRldGVjdG9yLFxuICAgICAgc2lnbmFsLFxuICAgICAgY3VzdG9tTWF0Y2hlclxuICAgIH0gPSBtZXJnZU9wdGlvbnMob3B0aW9ucywgZGVmYXVsdE9wdGlvbnMpO1xuICAgIGNvbnN0IHVuaWZ5UHJvbWlzZUtleSA9IFtcbiAgICAgIHNlbGVjdG9yLFxuICAgICAgdGFyZ2V0LFxuICAgICAgdW5pZnlQcm9jZXNzLFxuICAgICAgb2JzZXJ2ZUNvbmZpZ3MsXG4gICAgICBkZXRlY3RvcixcbiAgICAgIHNpZ25hbCxcbiAgICAgIGN1c3RvbU1hdGNoZXJcbiAgICBdO1xuICAgIGNvbnN0IGNhY2hlZFByb21pc2UgPSB1bmlmeUNhY2hlLmdldCh1bmlmeVByb21pc2VLZXkpO1xuICAgIGlmICh1bmlmeVByb2Nlc3MgJiYgY2FjaGVkUHJvbWlzZSkge1xuICAgICAgcmV0dXJuIGNhY2hlZFByb21pc2U7XG4gICAgfVxuICAgIGNvbnN0IGRldGVjdFByb21pc2UgPSBuZXcgUHJvbWlzZShcbiAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9Bc3luY1Byb21pc2VFeGVjdXRvcjogYXZvaWQgbmVzdGluZyBwcm9taXNlXG4gICAgICBhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmIChzaWduYWw/LmFib3J0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KHNpZ25hbC5yZWFzb24pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoXG4gICAgICAgICAgYXN5bmMgKG11dGF0aW9ucykgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBfIG9mIG11dGF0aW9ucykge1xuICAgICAgICAgICAgICBpZiAoc2lnbmFsPy5hYm9ydGVkKSB7XG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnN0IGRldGVjdFJlc3VsdDIgPSBhd2FpdCBkZXRlY3RFbGVtZW50KHtcbiAgICAgICAgICAgICAgICBzZWxlY3RvcixcbiAgICAgICAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgICAgICAgZGV0ZWN0b3IsXG4gICAgICAgICAgICAgICAgY3VzdG9tTWF0Y2hlclxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgaWYgKGRldGVjdFJlc3VsdDIuaXNEZXRlY3RlZCkge1xuICAgICAgICAgICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRldGVjdFJlc3VsdDIucmVzdWx0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgc2lnbmFsPy5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAgIFwiYWJvcnRcIixcbiAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KHNpZ25hbC5yZWFzb24pO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgeyBvbmNlOiB0cnVlIH1cbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgZGV0ZWN0UmVzdWx0ID0gYXdhaXQgZGV0ZWN0RWxlbWVudCh7XG4gICAgICAgICAgc2VsZWN0b3IsXG4gICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgIGRldGVjdG9yLFxuICAgICAgICAgIGN1c3RvbU1hdGNoZXJcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChkZXRlY3RSZXN1bHQuaXNEZXRlY3RlZCkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKGRldGVjdFJlc3VsdC5yZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUodGFyZ2V0LCBvYnNlcnZlQ29uZmlncyk7XG4gICAgICB9XG4gICAgKS5maW5hbGx5KCgpID0+IHtcbiAgICAgIHVuaWZ5Q2FjaGUuZGVsZXRlKHVuaWZ5UHJvbWlzZUtleSk7XG4gICAgfSk7XG4gICAgdW5pZnlDYWNoZS5zZXQodW5pZnlQcm9taXNlS2V5LCBkZXRlY3RQcm9taXNlKTtcbiAgICByZXR1cm4gZGV0ZWN0UHJvbWlzZTtcbiAgfTtcbn1cbmFzeW5jIGZ1bmN0aW9uIGRldGVjdEVsZW1lbnQoe1xuICB0YXJnZXQsXG4gIHNlbGVjdG9yLFxuICBkZXRlY3RvcixcbiAgY3VzdG9tTWF0Y2hlclxufSkge1xuICBjb25zdCBlbGVtZW50ID0gY3VzdG9tTWF0Y2hlciA/IGN1c3RvbU1hdGNoZXIoc2VsZWN0b3IpIDogdGFyZ2V0LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICByZXR1cm4gYXdhaXQgZGV0ZWN0b3IoZWxlbWVudCk7XG59XG5jb25zdCB3YWl0RWxlbWVudCA9IGNyZWF0ZVdhaXRFbGVtZW50KHtcbiAgZGVmYXVsdE9wdGlvbnM6IGdldERlZmF1bHRPcHRpb25zKClcbn0pO1xuXG5leHBvcnQgeyBjcmVhdGVXYWl0RWxlbWVudCwgZ2V0RGVmYXVsdE9wdGlvbnMsIHdhaXRFbGVtZW50IH07XG4iXSwibmFtZXMiOlsiZGVmaW5pdGlvbiIsIlJlYWRhYmlsaXR5IiwibmV4dCIsImFuY2VzdG9ycyIsImNvbnRlbnQiLCJyb290IiwicmVxdWlyZSQkMCIsInJlcXVpcmUkJDEiLCJydWxlcyIsImlzQmxvY2siLCJpc1ZvaWQiLCJub2RlIiwicmVzdWx0IiwiX2EiLCJwcmludCIsImxvZ2dlciIsIl9iIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBTyxXQUFTLG9CQUFvQkEsYUFBWTtBQUM5QyxXQUFPQTtBQUFBLEVBQ1Q7Ozs7Ozs7QUN3QkEsZUFBU0MsYUFBWSxLQUFLLFNBQVM7QUFFakMsWUFBSSxXQUFXLFFBQVEsaUJBQWlCO0FBQ3RDLGdCQUFNO0FBQ04sb0JBQVUsVUFBVSxDQUFDO0FBQUEsUUFDekIsV0FBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLGlCQUFpQjtBQUN2QyxnQkFBTSxJQUFJLE1BQU0sd0VBQXdFO0FBQUEsUUFDNUY7QUFDRSxrQkFBVSxXQUFXLENBQUE7QUFFckIsYUFBSyxPQUFPO0FBQ1osYUFBSyxrQkFBa0IsS0FBSyxLQUFLLFdBQVc7QUFDNUMsYUFBSyxnQkFBZ0I7QUFDckIsYUFBSyxpQkFBaUI7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LElBQUksU0FBUztBQUFBLElBQzNCO0FBQUEsSUFFQSxJQUFJLE1BQU07QUFDVCxZQUFNLEVBQUMsVUFBUyxJQUFJLEtBQUssZUFBZSxJQUFJO0FBQzVDLGFBQU8sTUFBTSxJQUFJLFNBQVM7QUFBQSxJQUMzQjtBQUFBLElBRUEsT0FBTyxNQUFNO0FBQ1osWUFBTSxFQUFDLFdBQVcsV0FBVSxJQUFJLEtBQUssZUFBZSxJQUFJO0FBQ3hELGFBQU8sUUFBUSxhQUFhLE1BQU0sT0FBTyxTQUFTLEtBQUssS0FBSyxZQUFZLE9BQU8sVUFBVSxDQUFDO0FBQUEsSUFDM0Y7QUFBQSxJQUVBLFFBQVE7QUFDUCxZQUFNLE1BQUs7QUFDWCxXQUFLLGNBQWMsTUFBSztBQUN4QixXQUFLLFlBQVksTUFBSztBQUFBLElBQ3ZCO0FBQUEsSUFFQSxLQUFLLE9BQU8sV0FBVyxJQUFJO0FBQzFCLGFBQU87QUFBQSxJQUNSO0FBQUEsSUFFQSxJQUFJLE9BQU87QUFDVixhQUFPLE1BQU07QUFBQSxJQUNkO0FBQUEsRUFDRDtBQ2xGbUIsTUFBSSxZQUFXOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7IiwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMSwyLDMsNCwxMCwxMSwxMiwxMywxNCwxNSwxNl19
