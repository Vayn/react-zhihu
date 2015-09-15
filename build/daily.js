/** @jsx: React.DOM */

var Notice = React.createClass({displayName: "Notice",

  _statusText: function(status) {
    var text;

    switch (status) {
      case "error":
        text = "网络错误，请稍后再试";
        break;
      case "loading":
        text = "加载评论中...";
        break;
      case "noComment":
        text = "暂无评论";
        break;
    }

    return text;
  },

  render: function() {
    return (
      React.createElement("div", {className: "am-u-sm-11 am-u-sm-centered"}, 
          React.createElement("span", {className: "notice notice--" + this.props.status}, 
            React.createElement("p", null, this._statusText(this.props.status))
          )
      )
    );
  }

});

var CommentList = React.createClass({displayName: "CommentList",

    getInitialState: function () {
        return { status: "loading" };
    },

    componentDidMount: function () {
        this._fetchComments();
    },

    shouldComponentUpdate: function (newProps, newState) {
        return this.props !== newProps || this.state.status !== newState.status;
    },

    _fetchComments: function () {
        $.ajax({
            url: this.props.url,
            dataType: 'json',
            success: function (data) {
                if (data.query.results.json) {
                    var comments = data.query.results.json.comments;
                    if (comments.constructor === Array) {
                        this.setState({
                            status: "success",
                            comments: comments
                        });
                    } else {
                        this.setState({
                            status: "success",
                            comments: [comments]
                        });
                    }
                } else {
                    this.setState({ status: "noComment" });
                }
            }.bind(this),
            error: function (xhr, status, err) {
                this.setState({ status: "error" });
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    _timeConverter: function (timestamp){
      var a = new Date(timestamp*1000);
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var year = a.getFullYear();
      var month = months[a.getMonth()];
      var date = a.getDate();
      var hour = a.getHours();
      var min = a.getMinutes();
      var sec = a.getSeconds();
      var time = date + ',' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
      return time;
    },

    render: function () {
        if (this.state.status === "success") {
            var comments = this.state.comments.map(function (comment) {
                return (
                    React.createElement("li", {className: "am-comment", key: comment.id}, 
                        React.createElement("article", {className: "am-comment"}, 
                          React.createElement("a", {href: "#link-to-user-home"}, 
                            React.createElement("img", {src: "assets/i/avatar.png", alt: "", className: "am-comment-avatar", width: "48", height: "48"})
                          ), 

                          React.createElement("div", {className: "am-comment-main"}, 
                            React.createElement("header", {className: "am-comment-hd"}, 
                              React.createElement("div", {className: "am-comment-meta"}, 
                                React.createElement("a", {href: "#link-to-user", className: "am-comment-author"}, comment.author), " " + ' ' +
                                "评论于 ", React.createElement("time", null, this._timeConverter(comment.time))
                              )
                            ), 

                            React.createElement("div", {className: "am-comment-bd"}, 
                                comment.content
                            )
                          )
                        )
                    )
                );
            }.bind(this));

            return (
                React.createElement("div", {className: "am-u-sm-11 am-u-sm-centered"}, 
                    React.createElement("ul", {className: "am-comments-list"}, 
                        comments
                    )
                )
            );
        }

        return (
            React.createElement(Notice, {status: this.state.status})
        );
    }

});

var Topic = React.createClass({displayName: "Topic",

    getInitialState: function () {
        return {
            toggleShortComment: false,
            toggleLongComment: false
        };
    },

    _handleClick: function (propertyName) {
        var newState = {};
        newState[propertyName] = !this.state[propertyName];
        this.setState(newState);
    },

    render: function () {
        var topic = this.props.topic;
        var shortText = this.state.toggleShortComment ? '[-]' : '[+]';
        var longText = this.state.toggleLongComment ? '[--]' : '[++]';

        return (
            React.createElement("li", null, 
                React.createElement("span", {
                    onClick: this._handleClick.bind(this, "toggleLongComment"), 
                    className: "am-badge am-badge-success cursor", 
                    title: "阅读长评论"
                }, 
                    longText
                ), 
                React.createElement("span", {
                    onClick: this._handleClick.bind(this, "toggleShortComment"), 
                    className: "am-badge am-badge-success cursor", 
                    title: "阅读短评论"
                }, 
                    shortText
                ), 
                React.createElement("a", {target: "_blank", href: "http://daily.zhihu.com/story/" + topic.id}, 
                    this.props.children.toString()
                ), 

                this.state.toggleLongComment ? React.createElement(CommentList, {url: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D%22http%3A%2F%2Fnews-at.zhihu.com%2Fapi%2F4%2Fstory%2F" + topic.id + "%2Flong-comments%22&format=json&diagnostics=true&callback="}) : null, 

                this.state.toggleShortComment ? React.createElement(CommentList, {url: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D%22http%3A%2F%2Fnews-at.zhihu.com%2Fapi%2F4%2Fstory%2F" + topic.id + "%2Fshort-comments%22&format=json&diagnostics=true&callback="}) : null
            )
        );
    }
});

var TopicList = React.createClass({displayName: "TopicList",
    render: function () {
        var topics = this.props.data.map(function (topic) {
            return (
                React.createElement(Topic, {topic: topic, key: topic.id}, 
                    topic.title
                )
            );
        });

        return (
            React.createElement("ul", {className: "am-list am-list-border am-list-striped"}, 
                topics
            )
        );
    }

});

var TopicBox = React.createClass({displayName: "TopicBox",

    getInitialState: function () {
        return {data: [], loaded: false};
    },

    componentDidMount: function () {
        this._loadTopicsFromServer();
        setInterval(this._loadTopicsFromServer, this.props.pollInterval);
    },

    _loadTopicsFromServer: function () {
        $.ajax({
            url: this.props.url,
            dataType: 'json',
            success: function (data) {
                this.setState({
                    data: data.query.results.stories,
                    loaded: true
                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        var footer = (
            React.createElement("p", null, "© 2014 ", React.createElement("a", {href: "https://gitcafe.com/Hz/daily-rv"}, "HeZhi, Inc. Licensed under MIT license."))
        );

        return (
        React.createElement("div", null, 
            React.createElement("div", {className: "header"}, 
                React.createElement("div", {className: "am-g"}, 
                    React.createElement("h1", null, "矢口乎日报Rv"), 
                    this.state.loaded ? React.createElement("p", null, "每日速递，请阅") : null
                )
            ), 
            React.createElement("div", {id: "main", className: "am-g"}, 
                React.createElement("div", {className: "am-u-lg-6 am-u-md-8 am-u-sm-centered"}, 
                    React.createElement(TopicList, {data: this.state.data}), 
                    this.state.loaded ? footer : React.createElement(Spinner, {loaded: this.state.loaded})
                )
            )
        )
        );
    }

});

var Spinner = React.createClass({displayName: "Spinner",

    render: function () {
        var loaded = this.props.loaded;
        if (loaded) {
            return null;
        } else {
            return (
                React.createElement("div", {className: "spinner"}, 
                    React.createElement("img", {alt: "loading", src: "assets/i/loading.gif"})
                )
            );
        }
    }

});

$(document).ready(function () {
    React.render(
        React.createElement(TopicBox, {
            url: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D%22http%3A%2F%2Fnews-at.zhihu.com%2Fapi%2F4%2Fnews%2Flatest%22%20and%20itemPath%20%3D%20%22json.stories%22&format=json&callback=", 
            pollInterval: 600000}
        ),
        document.body
    );
});
