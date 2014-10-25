"use strict";
(function($, undefined) {
    $.fn.Hotmap = function(options) {
        if (this.length === 0) return false;
        var opts = $.extend({}, $.fn.Hotmap.defaults, options);
        var idx = 0;
        // 保存热点
        this.maps = opts.maps || [];
        var slef=this;
        return this.each(function(index, el) {
            var $this = $(this);
            // 添加父容器
            $this.wrap('<div class="hotmap-wrapper"></div>');
            var wrapper = $this.parent('.hotmap-wrapper');

            // 添加热区容器
            wrapper.append("<div class='hotmap-pos-containner'></div>");
            var pos_containner = wrapper.find('.hotmap-pos-containner');

            var width = 0,
                height = 0;
            if (parseInt(opts.width) > 0 && parseInt(opts.height) > 0) {
                width = opts.width;
                height = opts.height;
            } else {
                width = $this.width();
                height = $this.height();
            }
            // wrapper css
            wrapper.css({
                height: height,
                width: width,
                position: "relative"
            });
            // pos_container css
            pos_containner.css({
                height: height,
                width: width,
                position: "absolute",
                left: 0,
                top: 0
            });
            function _init(){
                var maps=slef.maps;
                if (maps.length===0) return;
                for(var i=0;i<maps.length;i++){
                    if (typeof maps[i].pos ==="object") {
                        _add_hot(maps[i].pos[0],maps[i].pos[1],maps[i].pos[2],maps[i].pos[3]);
                    };
                }
            }
            _init();
            // 绘图代理
            var proxy_box = "<div id='hotmap-proxy-box'></div>";
            pos_containner.append(proxy_box);
            var proxy = $("#hotmap-proxy-box");
            var _init_proxy = (function() {
                proxy.css({
                    "display": "none",
                    "border": "1px dashed #3ebee7",
                    "position": "absolute",
                    "left": 0,
                    "top": 0,
                    "width": 0,
                    "height": 0,
                    "background-color": "rgba(199, 207, 219, 0.3)",
                });
            })();
            var _reset_proxy = function() {
                proxy.css({
                    "display": "none",
                    "left": 0,
                    "top": 0,
                    "width": 0,
                    "height": 0
                });
            }

            // 绑定事件
            pos_containner.unbind('mousedown').bind('mousedown', function(event) {

                // mousedown  鼠标左键
                if (event.which === 1) {
                    var init_x = event.pageX - $(this).offset().left,
                        init_y = event.pageY - $(this).offset().top;
                    $(this).data('down', true)
                        .data('ox', init_x)
                        .data('oy', init_y);
                    // 设置代理位置
                    proxy.css({
                        "display": "block",
                        "left": init_x,
                        "top": init_y
                    });
                }
            });

            pos_containner.bind('mousemove', function(event) {
                if ($(this).data('down')) {
                    var w = (event.pageX - $(this).data('ox')),
                        h = (event.pageY - $(this).data('oy'));
                    // 保存width  height
                    $(this).data('h', h)
                        .data('w', w);
                    proxy.css({
                        "width": w,
                        "height": h
                    });
                    if (event.pageX - $(this).width() >= -3 || event.pageY - $(this).height() >= -3) {
                        $(this).mouseup();
                    };
                    return false
                }


                // 移动热点
                if ($(this).data('drag')) {
                    var dx = event.pageX - $(this).data('drag_pos').px;
                    var dy = event.pageY - $(this).data('drag_pos').py;

                    if ((dx === 0) && (dy === 0)) {
                        return false;
                    }
                    var map_position = $(this).data('drag_pos').$drag;

                    var p = map_position.position();

                    var left = p.left + dx;
                    if (left < 0) left = 0;
                    var top = p.top + dy;
                    if (top < 0) top = 0;
                    var bottom = top + map_position.height();
                    if (bottom > $(this).height()) {
                        top = top - (bottom - $(this).height());
                    }
                    var right = left + map_position.width();
                    if (right > $(this).width()) {
                        left = left - (right - $(this).width());
                    }
                    map_position.css({
                        left: left,
                        top: top
                    });
                    $(this).data("drag_pos", {
                        px: event.pageX,
                        py: event.pageY,
                        $drag: map_position
                    })
                }

                // 修改大小
                if ($(this).data('resize')) {
                    var dx = event.pageX - $(this).data('resize_pos').px;
                    var dy = event.pageY - $(this).data('resize_pos').py;

                    if ((dx == 0) && (dy == 0)) {
                        return false;
                    }
                    var map_position = $(this).data('resize_pos').$resize;
                    var p = map_position.position();
                    var left = p.left;
                    var top = p.top;
                    var height = map_position.height() + dy;
                    if ((top + height) > $(this).height()) {
                        height = height - ((top + height) - $(this).height());
                    }
                    height=Math.max(50,height);
                    var width = map_position.width() + dx;
                    if ((left + width) > $(this).width()) {
                        width = width - ((left + width) - $(this).width());
                    }
                    width=Math.max(50,width);
                    map_position.css({
                        width: width,
                        height: height
                    });
                    $(this).data("resize_pos", {
                        px: event.pageX,
                        py: event.pageY,
                        $resize: map_position
                    })
                }
            });

            pos_containner.bind('mouseup', function(event) {
                var l = $(this).data('ox'),
                    t = $(this).data('oy'),
                    w = $(this).data('w'),
                    h = $(this).data('h');
                if(_add_hot(l, t, w, h)){
                    slef.maps.push({pos:[l, t, w, h]});
                };
                $(this).data('down', false)
                    .data('ox', 0)
                    .data('oy', 0)
                    .data('h', 0)
                    .data('w', 0)
                    .data('drag', false)
                    .data("drag_pos", {})
                    .data('resize', false)
                    .data("resize_pos", {});
                // 重置
                _reset_proxy();
            });

            // 移动
            pos_containner.delegate('.hotmap-drag-box', 'mousedown', function(event) {
                if (event.which === 1) {
                    pos_containner.data('drag', true)
                        .data("drag_pos", {
                            px: event.pageX,
                            py: event.pageY,
                            $drag: $(this)
                        });
                }
                event.stopPropagation();
            });
            pos_containner.delegate('.hotmap-drag-box', 'mouseup', function(event) {
                pos_containner.data('drag', false)
                    .data("drag_pos", {});
                event.stopPropagation();
            })


            // 修改大小

            pos_containner.delegate('.resize', 'mousedown', function(event) {
                if (event.which === 1) {
                    pos_containner.data('resize', true)
                        .data("resize_pos", {
                            px: event.pageX,
                            py: event.pageY,
                            $resize: $(this).parent()
                        });
                }
                event.stopPropagation();
            });
            pos_containner.delegate('.resize', 'mouseup', function(event) {
                pos_containner.data('resize', false)
                    .data("resize_pos", {});
                event.stopPropagation();
            });

            // 删除热点
            pos_containner.delegate('.delete', 'click', function(event) {
                var hot_bg=$(this).parent();
                var idx=hot_bg.index()-1;
                hot_bg.remove();
                slef.maps.splice(idx, 1);
                event.stopPropagation();
            });
            // 
            function _add_hot(left, top, width, height) {
                // test
                if (width > 50 && height > 50) {
                    var uid = _guid();
                    pos_containner.append("<div class='hotmap-drag-box' id='" + uid + "'></div>");
                    var drag_box = $("#" + uid);
                    drag_box.append('<div class="hotmap-drag-inner"></div>');
                    var drag_inner=drag_box.find('.hotmap-drag-inner');
                    drag_inner.css({
                        "width": '96%',
                        "height": '100%',
                        "left":"50%",
                        "margin-left":"-48%",
                        "position":"absolute",
                        "top":0,
                        "overflow":"hidden"
                    });
                    drag_box.css({
                        left: left,
                        top: top,
                        width: width,
                        height: height
                    });
                    drag_box.append("<a href='javascript:;' class='delete'>×</a><div class='resize'></div>");
                    _render_css();
                    return true;
                }else return false
                
            }



            function _render_css() {
                $(".hotmap-drag-box").css({
                    "border": "1px dashed #3ebee7",
                    "position": "absolute",
                    "background-color": "rgba(199, 207, 219, 0.3)",
                    cursor: 'move'
                });

                $(".hotmap-drag-box .delete").css({
                    position: 'absolute',
                    width: '12px',
                    height: '12px',
                    right: '-5px',
                    top: '-5px',
                    color: '#fff',
                    "line-height": "12px",
                    "text-align": "center",
                    display: 'block',
                    "border-radius": "50%",
                    "font-size": "12px",
                    "text-decoration": "none",
                    "background-color": "#ec5653"
                });

                $(".hotmap-drag-box .resize").css({
                    position: 'absolute',
                    width: '8px',
                    height: '8px',
                    right: '-4px',
                    bottom: '-4px',
                    "background-color": '#3ebee7',
                    "border-radius": "50%",
                    cursor: 'nw-resize'
                });
            }

            // via http://bbs.html5cn.org/thread-84691-1-1.html
            function _guid() {
                function S4() {
                    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
                }
                return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
            }
        });
    };

    $.fn.Hotmap.defaults = {
        maps: [],
        width: null,
        height: null
    };
})(jQuery)