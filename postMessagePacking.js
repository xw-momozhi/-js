var packing=(function(){
	var evenID=0;
	function addEventCllback(ev,cllback){
		var cllbackID="cllbackID"+evenID++
		addEvent(cllbackID,function(e){
			 if(ev){
				  cllback.apply(ev,e.detail);
			 }else{
				  cllback.apply(window,e.detail);
			 }
			 removeEvent(cllbackID);
		})
		return cllbackID;
	}
	//回调方法转换成回调方法字符串
	function getFunctionString(ev,cllback){
		var str="function:";
		var data={
			callbackId:addEventCllback(ev,cllback),
			parames:[]
		};
		return str+JSON.stringify(data);
	}
	//将穿过来的方法字符串 转换成方法对象
	function getFunction(str){
		var data=JSON.parse(str.replace(/^function:/,""));
		return function(){
			var parames;
			if(arguments.length>0){
				parames=[];
				for(var i=0;i<arguments.length;i++){
					parames.push(arguments[i])
				}
			}
			packing.sendMessage(data.callbackId,parames)
		}
	}
	//发送数据过滤
	function stringJson(json){
		var _cordova={}
		if(json instanceof Array){
			_cordova=[];
		}
		each(json,_cordova)
		function each(data,_data){
			for(var i in data){
				if(typeof(data[i])=="function"){
					_data[i]=getFunctionString(data,data[i]);
				}else if(data[i] instanceof Object){
					_data[i]={}
					each(data[i],_data[i]);
				}else if(data[i] instanceof Array){
					_data[i]=[]
					each(data[i],_data[i]);
				}else{
					_data[i]=data[i]
				}
			}
		}
		return _cordova;
	}
	//接收数据过滤
	function acceptJson(json){
		each(json)
		function each(data){
			for(var i in data){
				if(typeof(data[i])=="string" && data[i].search(/^function/)>=0){
					data[i]=getFunction(data[i]);
				}else if(data[i] instanceof Object){
					each(data[i]);
				}else if(data[i] instanceof Array){
					each(data[i]);
				}
			}
		}
		return json;
	}
	//监听消息
	window.addEventListener('message',function(event){
		if(event && event.data){
			var data=event.data;
			acceptJson(data.data);
			evenTrigger(data.name,data.data);
		}
	}, false);
	//触发事件
	function evenTrigger(evenName,data){
		var myEvent = new CustomEvent(evenName,{detail:data});
			// 随后在对应的元素上触发该事件
		if(window.dispatchEvent) {  
			window.dispatchEvent(myEvent);
			document.dispatchEvent(myEvent);
		} else {
			document.fireEvent(myEvent);
			document.dispatchEvent(myEvent);
		}
	}
	//添加自定义事件
	function addEvent(evenName,cllback){
		var handler=function(e){
			cllback(e);
			removeEvent(evenName,handler)
		}
		window.addEventListener(evenName, handler,false);
	}
	//移除自定义事件
	function removeEvent(evenName,handler){
		window.removeEventListener(evenName,handler,false);
	}
	return {
		setStringJson:stringJson,
		sendMessage:function(name,json){//发送消息
			window.frames[0].postMessage({name:name,data:stringJson(json)}, '*');
		},
		evenfilter:function(callback){//过滤注册事件参数
			return function(e){
				if(e && e.detail){
					var detail=e.detail;
					if(callback){
						callback(detail);
					}
				}
			}
		}
	}
})();
