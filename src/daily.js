/** @jsx: React.DOM */

var Notice = React.createClass({

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
      <div className="am-u-sm-11 am-u-sm-centered">
          <span className={"notice notice--" + this.props.type}>
            <p>{this._statusText(this.props.type)}</p>
          </span>
      </div>
    );
  }

});

var CommentList = React.createClass({

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
                    <li className="am-comment" key={comment.id}>
                        <article className="am-comment">
                          <a href="#link-to-user-home">
                            <img src="assets/i/avatar.png" alt="" className="am-comment-avatar" width="48" height="48"/>
                          </a>

                          <div className="am-comment-main">
                            <header className="am-comment-hd">
                              <div className="am-comment-meta">
                                <a href="#link-to-user" className="am-comment-author">{comment.author}</a>&nbsp;
                                评论于 <time>{this._timeConverter(comment.time)}</time>
                              </div>
                            </header>

                            <div className="am-comment-bd">
                                {comment.content}
                            </div>
                          </div>
                        </article>
                    </li>
                );
            }.bind(this));

            return (
                <div className="am-u-sm-11 am-u-sm-centered">
                    <ul className="am-comments-list">
                        {comments}
                    </ul>
                </div>
            );
        }

        return (
            <Notice type={this.state.status} />
        );
    }

});

var Topic = React.createClass({

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
            <li>
                <span
                    onClick={this._handleClick.bind(this, "toggleLongComment")}
                    className="am-badge am-badge-success"
                    title="阅读长评论"
                >
                    {longText}
                </span>
                <span
                    onClick={this._handleClick.bind(this, "toggleShortComment")}
                    className="am-badge am-badge-success"
                    title="阅读短评论"
                >
                    {shortText}
                </span>
                <a target="_blank" href={"http://daily.zhihu.com/story/" + topic.id}>
                    {this.props.children.toString()}
                </a>

                {this.state.toggleLongComment ? <CommentList url={"https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D%22http%3A%2F%2Fnews-at.zhihu.com%2Fapi%2F4%2Fstory%2F" + topic.id + "%2Flong-comments%22&format=json&diagnostics=true&callback="} /> : null}

                {this.state.toggleShortComment ? <CommentList url={"https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D%22http%3A%2F%2Fnews-at.zhihu.com%2Fapi%2F4%2Fstory%2F" + topic.id + "%2Fshort-comments%22&format=json&diagnostics=true&callback="} /> : null}
            </li>
        );
    }
});

var TopicList = React.createClass({
    render: function () {
        var topics = this.props.data.map(function (topic) {
            return (
                <Topic topic={topic} key={topic.id}>
                    {topic.title}
                </Topic>
            );
        });

        return (
            <ul className="am-list am-list-border am-list-striped">
                {topics}
            </ul>
        );
    }

});

var TopicBox = React.createClass({

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
            <p>© 2014 <a href="https://gitcafe.com/Hz/daily-rv">HeZhi, Inc. Licensed under MIT license.</a></p>
        );

        return (
        <div>
            <div className="header">
                <div className="am-g">
                    <h1>矢口乎日报Rv</h1>
                    {this.state.loaded ? <p>每日速递，请阅</p> : null}
                </div>
            </div>
            <div id="main" className="am-g">
                <div className="am-u-lg-6 am-u-md-8 am-u-sm-centered">
                    <TopicList data={this.state.data} />
                    {this.state.loaded ? footer : <Spinner loaded={this.state.loaded} />}
                </div>
            </div>
        </div>
        );
    }

});

var Spinner = React.createClass({

    render: function () {
        var loaded = this.props.loaded;
        if (loaded) {
            return null;
        } else {
            return (
                <div className="spinner cube-grid">
                    <div className="cube"></div>
                    <div className="cube"></div>
                    <div className="cube"></div>
                    <div className="cube"></div>
                    <div className="cube"></div>
                    <div className="cube"></div>
                    <div className="cube"></div>
                    <div className="cube"></div>
                    <div className="cube"></div>
                </div>
            );
        }
    }

});

$(document).ready(function () {
    React.render(
        <TopicBox
            url="https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D%22http%3A%2F%2Fnews-at.zhihu.com%2Fapi%2F4%2Fnews%2Flatest%22%20and%20itemPath%20%3D%20%22json.stories%22&format=json&callback="
            pollInterval={600000}
        />,
        document.body
    );
});
