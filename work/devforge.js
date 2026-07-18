var e=Object.create,t=Object.defineProperty,n=Object.getOwnPropertyDescriptor,r=Object.getOwnPropertyNames,i=Object.getPrototypeOf,a=Object.prototype.hasOwnProperty,o=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t),e=null),t.exports),s=(e,n)=>{let r={};for(var i in e)t(r,i,{get:e[i],enumerable:!0});return n||t(r,Symbol.toStringTag,{value:`Module`}),r},c=(e,i,o,s)=>{if(i&&typeof i==`object`||typeof i==`function`)for(var c=r(i),l=0,u=c.length,d;l<u;l++)d=c[l],!a.call(e,d)&&d!==o&&t(e,d,{get:(e=>i[e]).bind(null,d),enumerable:!(s=n(i,d))||s.enumerable});return e},l=(n,r,a)=>(a=n==null?{}:e(i(n)),c(r||!n||!n.__esModule?t(a,`default`,{value:n,enumerable:!0}):a,n));(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var u=o((e=>{var t=Symbol.for(`react.transitional.element`),n=Symbol.for(`react.portal`),r=Symbol.for(`react.fragment`),i=Symbol.for(`react.strict_mode`),a=Symbol.for(`react.profiler`),o=Symbol.for(`react.consumer`),s=Symbol.for(`react.context`),c=Symbol.for(`react.forward_ref`),l=Symbol.for(`react.suspense`),u=Symbol.for(`react.memo`),d=Symbol.for(`react.lazy`),f=Symbol.for(`react.activity`),p=Symbol.iterator;function m(e){return typeof e!=`object`||!e?null:(e=p&&e[p]||e[`@@iterator`],typeof e==`function`?e:null)}var h={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},g=Object.assign,_={};function v(e,t,n){this.props=e,this.context=t,this.refs=_,this.updater=n||h}v.prototype.isReactComponent={},v.prototype.setState=function(e,t){if(typeof e!=`object`&&typeof e!=`function`&&e!=null)throw Error(`takes an object of state variables to update or a function which returns an object of state variables.`);this.updater.enqueueSetState(this,e,t,`setState`)},v.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,`forceUpdate`)};function y(){}y.prototype=v.prototype;function b(e,t,n){this.props=e,this.context=t,this.refs=_,this.updater=n||h}var x=b.prototype=new y;x.constructor=b,g(x,v.prototype),x.isPureReactComponent=!0;var S=Array.isArray;function C(){}var w={H:null,A:null,T:null,S:null},T=Object.prototype.hasOwnProperty;function E(e,n,r){var i=r.ref;return{$$typeof:t,type:e,key:n,ref:i===void 0?null:i,props:r}}function ee(e,t){return E(e.type,t,e.props)}function D(e){return typeof e==`object`&&!!e&&e.$$typeof===t}function te(e){var t={"=":`=0`,":":`=2`};return`$`+e.replace(/[=:]/g,function(e){return t[e]})}var ne=/\/+/g;function re(e,t){return typeof e==`object`&&e&&e.key!=null?te(``+e.key):t.toString(36)}function ie(e){switch(e.status){case`fulfilled`:return e.value;case`rejected`:throw e.reason;default:switch(typeof e.status==`string`?e.then(C,C):(e.status=`pending`,e.then(function(t){e.status===`pending`&&(e.status=`fulfilled`,e.value=t)},function(t){e.status===`pending`&&(e.status=`rejected`,e.reason=t)})),e.status){case`fulfilled`:return e.value;case`rejected`:throw e.reason}}throw e}function ae(e,r,i,a,o){var s=typeof e;(s===`undefined`||s===`boolean`)&&(e=null);var c=!1;if(e===null)c=!0;else switch(s){case`bigint`:case`string`:case`number`:c=!0;break;case`object`:switch(e.$$typeof){case t:case n:c=!0;break;case d:return c=e._init,ae(c(e._payload),r,i,a,o)}}if(c)return o=o(e),c=a===``?`.`+re(e,0):a,S(o)?(i=``,c!=null&&(i=c.replace(ne,`$&/`)+`/`),ae(o,r,i,``,function(e){return e})):o!=null&&(D(o)&&(o=ee(o,i+(o.key==null||e&&e.key===o.key?``:(``+o.key).replace(ne,`$&/`)+`/`)+c)),r.push(o)),1;c=0;var l=a===``?`.`:a+`:`;if(S(e))for(var u=0;u<e.length;u++)a=e[u],s=l+re(a,u),c+=ae(a,r,i,s,o);else if(u=m(e),typeof u==`function`)for(e=u.call(e),u=0;!(a=e.next()).done;)a=a.value,s=l+re(a,u++),c+=ae(a,r,i,s,o);else if(s===`object`){if(typeof e.then==`function`)return ae(ie(e),r,i,a,o);throw r=String(e),Error(`Objects are not valid as a React child (found: `+(r===`[object Object]`?`object with keys {`+Object.keys(e).join(`, `)+`}`:r)+`). If you meant to render a collection of children, use an array instead.`)}return c}function oe(e,t,n){if(e==null)return e;var r=[],i=0;return ae(e,r,``,``,function(e){return t.call(n,e,i++)}),r}function se(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(t){(e._status===0||e._status===-1)&&(e._status=1,e._result=t)},function(t){(e._status===0||e._status===-1)&&(e._status=2,e._result=t)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var O=typeof reportError==`function`?reportError:function(e){if(typeof window==`object`&&typeof window.ErrorEvent==`function`){var t=new window.ErrorEvent(`error`,{bubbles:!0,cancelable:!0,message:typeof e==`object`&&e&&typeof e.message==`string`?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process==`object`&&typeof process.emit==`function`){process.emit(`uncaughtException`,e);return}console.error(e)},k={map:oe,forEach:function(e,t,n){oe(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return oe(e,function(){t++}),t},toArray:function(e){return oe(e,function(e){return e})||[]},only:function(e){if(!D(e))throw Error(`React.Children.only expected to receive a single React element child.`);return e}};e.Activity=f,e.Children=k,e.Component=v,e.Fragment=r,e.Profiler=a,e.PureComponent=b,e.StrictMode=i,e.Suspense=l,e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=w,e.__COMPILER_RUNTIME={__proto__:null,c:function(e){return w.H.useMemoCache(e)}},e.cache=function(e){return function(){return e.apply(null,arguments)}},e.cacheSignal=function(){return null},e.cloneElement=function(e,t,n){if(e==null)throw Error(`The argument must be a React element, but you passed `+e+`.`);var r=g({},e.props),i=e.key;if(t!=null)for(a in t.key!==void 0&&(i=``+t.key),t)!T.call(t,a)||a===`key`||a===`__self`||a===`__source`||a===`ref`&&t.ref===void 0||(r[a]=t[a]);var a=arguments.length-2;if(a===1)r.children=n;else if(1<a){for(var o=Array(a),s=0;s<a;s++)o[s]=arguments[s+2];r.children=o}return E(e.type,i,r)},e.createContext=function(e){return e={$$typeof:s,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null},e.Provider=e,e.Consumer={$$typeof:o,_context:e},e},e.createElement=function(e,t,n){var r,i={},a=null;if(t!=null)for(r in t.key!==void 0&&(a=``+t.key),t)T.call(t,r)&&r!==`key`&&r!==`__self`&&r!==`__source`&&(i[r]=t[r]);var o=arguments.length-2;if(o===1)i.children=n;else if(1<o){for(var s=Array(o),c=0;c<o;c++)s[c]=arguments[c+2];i.children=s}if(e&&e.defaultProps)for(r in o=e.defaultProps,o)i[r]===void 0&&(i[r]=o[r]);return E(e,a,i)},e.createRef=function(){return{current:null}},e.forwardRef=function(e){return{$$typeof:c,render:e}},e.isValidElement=D,e.lazy=function(e){return{$$typeof:d,_payload:{_status:-1,_result:e},_init:se}},e.memo=function(e,t){return{$$typeof:u,type:e,compare:t===void 0?null:t}},e.startTransition=function(e){var t=w.T,n={};w.T=n;try{var r=e(),i=w.S;i!==null&&i(n,r),typeof r==`object`&&r&&typeof r.then==`function`&&r.then(C,O)}catch(e){O(e)}finally{t!==null&&n.types!==null&&(t.types=n.types),w.T=t}},e.unstable_useCacheRefresh=function(){return w.H.useCacheRefresh()},e.use=function(e){return w.H.use(e)},e.useActionState=function(e,t,n){return w.H.useActionState(e,t,n)},e.useCallback=function(e,t){return w.H.useCallback(e,t)},e.useContext=function(e){return w.H.useContext(e)},e.useDebugValue=function(){},e.useDeferredValue=function(e,t){return w.H.useDeferredValue(e,t)},e.useEffect=function(e,t){return w.H.useEffect(e,t)},e.useEffectEvent=function(e){return w.H.useEffectEvent(e)},e.useId=function(){return w.H.useId()},e.useImperativeHandle=function(e,t,n){return w.H.useImperativeHandle(e,t,n)},e.useInsertionEffect=function(e,t){return w.H.useInsertionEffect(e,t)},e.useLayoutEffect=function(e,t){return w.H.useLayoutEffect(e,t)},e.useMemo=function(e,t){return w.H.useMemo(e,t)},e.useOptimistic=function(e,t){return w.H.useOptimistic(e,t)},e.useReducer=function(e,t,n){return w.H.useReducer(e,t,n)},e.useRef=function(e){return w.H.useRef(e)},e.useState=function(e){return w.H.useState(e)},e.useSyncExternalStore=function(e,t,n){return w.H.useSyncExternalStore(e,t,n)},e.useTransition=function(){return w.H.useTransition()},e.version=`19.2.7`})),d=o(((e,t)=>{t.exports=u()})),f=o((e=>{function t(e,t){var n=e.length;e.push(t);a:for(;0<n;){var r=n-1>>>1,a=e[r];if(0<i(a,t))e[r]=t,e[n]=a,n=r;else break a}}function n(e){return e.length===0?null:e[0]}function r(e){if(e.length===0)return null;var t=e[0],n=e.pop();if(n!==t){e[0]=n;a:for(var r=0,a=e.length,o=a>>>1;r<o;){var s=2*(r+1)-1,c=e[s],l=s+1,u=e[l];if(0>i(c,n))l<a&&0>i(u,c)?(e[r]=u,e[l]=n,r=l):(e[r]=c,e[s]=n,r=s);else if(l<a&&0>i(u,n))e[r]=u,e[l]=n,r=l;else break a}}return t}function i(e,t){var n=e.sortIndex-t.sortIndex;return n===0?e.id-t.id:n}if(e.unstable_now=void 0,typeof performance==`object`&&typeof performance.now==`function`){var a=performance;e.unstable_now=function(){return a.now()}}else{var o=Date,s=o.now();e.unstable_now=function(){return o.now()-s}}var c=[],l=[],u=1,d=null,f=3,p=!1,m=!1,h=!1,g=!1,_=typeof setTimeout==`function`?setTimeout:null,v=typeof clearTimeout==`function`?clearTimeout:null,y=typeof setImmediate<`u`?setImmediate:null;function b(e){for(var i=n(l);i!==null;){if(i.callback===null)r(l);else if(i.startTime<=e)r(l),i.sortIndex=i.expirationTime,t(c,i);else break;i=n(l)}}function x(e){if(h=!1,b(e),!m)if(n(c)!==null)m=!0,S||(S=!0,D());else{var t=n(l);t!==null&&re(x,t.startTime-e)}}var S=!1,C=-1,w=5,T=-1;function E(){return g?!0:!(e.unstable_now()-T<w)}function ee(){if(g=!1,S){var t=e.unstable_now();T=t;var i=!0;try{a:{m=!1,h&&(h=!1,v(C),C=-1),p=!0;var a=f;try{b:{for(b(t),d=n(c);d!==null&&!(d.expirationTime>t&&E());){var o=d.callback;if(typeof o==`function`){d.callback=null,f=d.priorityLevel;var s=o(d.expirationTime<=t);if(t=e.unstable_now(),typeof s==`function`){d.callback=s,b(t),i=!0;break b}d===n(c)&&r(c),b(t)}else r(c);d=n(c)}if(d!==null)i=!0;else{var u=n(l);u!==null&&re(x,u.startTime-t),i=!1}}break a}finally{d=null,f=a,p=!1}i=void 0}}finally{i?D():S=!1}}}var D;if(typeof y==`function`)D=function(){y(ee)};else if(typeof MessageChannel<`u`){var te=new MessageChannel,ne=te.port2;te.port1.onmessage=ee,D=function(){ne.postMessage(null)}}else D=function(){_(ee,0)};function re(t,n){C=_(function(){t(e.unstable_now())},n)}e.unstable_IdlePriority=5,e.unstable_ImmediatePriority=1,e.unstable_LowPriority=4,e.unstable_NormalPriority=3,e.unstable_Profiling=null,e.unstable_UserBlockingPriority=2,e.unstable_cancelCallback=function(e){e.callback=null},e.unstable_forceFrameRate=function(e){0>e||125<e?console.error(`forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported`):w=0<e?Math.floor(1e3/e):5},e.unstable_getCurrentPriorityLevel=function(){return f},e.unstable_next=function(e){switch(f){case 1:case 2:case 3:var t=3;break;default:t=f}var n=f;f=t;try{return e()}finally{f=n}},e.unstable_requestPaint=function(){g=!0},e.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var n=f;f=e;try{return t()}finally{f=n}},e.unstable_scheduleCallback=function(r,i,a){var o=e.unstable_now();switch(typeof a==`object`&&a?(a=a.delay,a=typeof a==`number`&&0<a?o+a:o):a=o,r){case 1:var s=-1;break;case 2:s=250;break;case 5:s=1073741823;break;case 4:s=1e4;break;default:s=5e3}return s=a+s,r={id:u++,callback:i,priorityLevel:r,startTime:a,expirationTime:s,sortIndex:-1},a>o?(r.sortIndex=a,t(l,r),n(c)===null&&r===n(l)&&(h?(v(C),C=-1):h=!0,re(x,a-o))):(r.sortIndex=s,t(c,r),m||p||(m=!0,S||(S=!0,D()))),r},e.unstable_shouldYield=E,e.unstable_wrapCallback=function(e){var t=f;return function(){var n=f;f=t;try{return e.apply(this,arguments)}finally{f=n}}}})),p=o(((e,t)=>{t.exports=f()})),m=o((e=>{var t=d();function n(e){var t=`https://react.dev/errors/`+e;if(1<arguments.length){t+=`?args[]=`+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+=`&args[]=`+encodeURIComponent(arguments[n])}return`Minified React error #`+e+`; visit `+t+` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`}function r(){}var i={d:{f:r,r:function(){throw Error(n(522))},D:r,C:r,L:r,m:r,X:r,S:r,M:r},p:0,findDOMNode:null},a=Symbol.for(`react.portal`);function o(e,t,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:a,key:r==null?null:``+r,children:e,containerInfo:t,implementation:n}}var s=t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function c(e,t){if(e===`font`)return``;if(typeof t==`string`)return t===`use-credentials`?t:``}e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=i,e.createPortal=function(e,t){var r=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)throw Error(n(299));return o(e,t,null,r)},e.flushSync=function(e){var t=s.T,n=i.p;try{if(s.T=null,i.p=2,e)return e()}finally{s.T=t,i.p=n,i.d.f()}},e.preconnect=function(e,t){typeof e==`string`&&(t?(t=t.crossOrigin,t=typeof t==`string`?t===`use-credentials`?t:``:void 0):t=null,i.d.C(e,t))},e.prefetchDNS=function(e){typeof e==`string`&&i.d.D(e)},e.preinit=function(e,t){if(typeof e==`string`&&t&&typeof t.as==`string`){var n=t.as,r=c(n,t.crossOrigin),a=typeof t.integrity==`string`?t.integrity:void 0,o=typeof t.fetchPriority==`string`?t.fetchPriority:void 0;n===`style`?i.d.S(e,typeof t.precedence==`string`?t.precedence:void 0,{crossOrigin:r,integrity:a,fetchPriority:o}):n===`script`&&i.d.X(e,{crossOrigin:r,integrity:a,fetchPriority:o,nonce:typeof t.nonce==`string`?t.nonce:void 0})}},e.preinitModule=function(e,t){if(typeof e==`string`)if(typeof t==`object`&&t){if(t.as==null||t.as===`script`){var n=c(t.as,t.crossOrigin);i.d.M(e,{crossOrigin:n,integrity:typeof t.integrity==`string`?t.integrity:void 0,nonce:typeof t.nonce==`string`?t.nonce:void 0})}}else t??i.d.M(e)},e.preload=function(e,t){if(typeof e==`string`&&typeof t==`object`&&t&&typeof t.as==`string`){var n=t.as,r=c(n,t.crossOrigin);i.d.L(e,n,{crossOrigin:r,integrity:typeof t.integrity==`string`?t.integrity:void 0,nonce:typeof t.nonce==`string`?t.nonce:void 0,type:typeof t.type==`string`?t.type:void 0,fetchPriority:typeof t.fetchPriority==`string`?t.fetchPriority:void 0,referrerPolicy:typeof t.referrerPolicy==`string`?t.referrerPolicy:void 0,imageSrcSet:typeof t.imageSrcSet==`string`?t.imageSrcSet:void 0,imageSizes:typeof t.imageSizes==`string`?t.imageSizes:void 0,media:typeof t.media==`string`?t.media:void 0})}},e.preloadModule=function(e,t){if(typeof e==`string`)if(t){var n=c(t.as,t.crossOrigin);i.d.m(e,{as:typeof t.as==`string`&&t.as!==`script`?t.as:void 0,crossOrigin:n,integrity:typeof t.integrity==`string`?t.integrity:void 0})}else i.d.m(e)},e.requestFormReset=function(e){i.d.r(e)},e.unstable_batchedUpdates=function(e,t){return e(t)},e.useFormState=function(e,t,n){return s.H.useFormState(e,t,n)},e.useFormStatus=function(){return s.H.useHostTransitionStatus()},e.version=`19.2.7`})),h=o(((e,t)=>{function n(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>`u`||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!=`function`))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(e){console.error(e)}}n(),t.exports=m()})),g=o((e=>{var t=p(),n=d(),r=h();function i(e){var t=`https://react.dev/errors/`+e;if(1<arguments.length){t+=`?args[]=`+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+=`&args[]=`+encodeURIComponent(arguments[n])}return`Minified React error #`+e+`; visit `+t+` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`}function a(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function o(e){var t=e,n=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,t.flags&4098&&(n=t.return),e=t.return;while(e)}return t.tag===3?n:null}function s(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function c(e){if(e.tag===31){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function l(e){if(o(e)!==e)throw Error(i(188))}function u(e){var t=e.alternate;if(!t){if(t=o(e),t===null)throw Error(i(188));return t===e?e:null}for(var n=e,r=t;;){var a=n.return;if(a===null)break;var s=a.alternate;if(s===null){if(r=a.return,r!==null){n=r;continue}break}if(a.child===s.child){for(s=a.child;s;){if(s===n)return l(a),e;if(s===r)return l(a),t;s=s.sibling}throw Error(i(188))}if(n.return!==r.return)n=a,r=s;else{for(var c=!1,u=a.child;u;){if(u===n){c=!0,n=a,r=s;break}if(u===r){c=!0,r=a,n=s;break}u=u.sibling}if(!c){for(u=s.child;u;){if(u===n){c=!0,n=s,r=a;break}if(u===r){c=!0,r=s,n=a;break}u=u.sibling}if(!c)throw Error(i(189))}}if(n.alternate!==r)throw Error(i(190))}if(n.tag!==3)throw Error(i(188));return n.stateNode.current===n?e:t}function f(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=f(e),t!==null)return t;e=e.sibling}return null}var m=Object.assign,g=Symbol.for(`react.element`),_=Symbol.for(`react.transitional.element`),v=Symbol.for(`react.portal`),y=Symbol.for(`react.fragment`),b=Symbol.for(`react.strict_mode`),x=Symbol.for(`react.profiler`),S=Symbol.for(`react.consumer`),C=Symbol.for(`react.context`),w=Symbol.for(`react.forward_ref`),T=Symbol.for(`react.suspense`),E=Symbol.for(`react.suspense_list`),ee=Symbol.for(`react.memo`),D=Symbol.for(`react.lazy`),te=Symbol.for(`react.activity`),ne=Symbol.for(`react.memo_cache_sentinel`),re=Symbol.iterator;function ie(e){return typeof e!=`object`||!e?null:(e=re&&e[re]||e[`@@iterator`],typeof e==`function`?e:null)}var ae=Symbol.for(`react.client.reference`);function oe(e){if(e==null)return null;if(typeof e==`function`)return e.$$typeof===ae?null:e.displayName||e.name||null;if(typeof e==`string`)return e;switch(e){case y:return`Fragment`;case x:return`Profiler`;case b:return`StrictMode`;case T:return`Suspense`;case E:return`SuspenseList`;case te:return`Activity`}if(typeof e==`object`)switch(e.$$typeof){case v:return`Portal`;case C:return e.displayName||`Context`;case S:return(e._context.displayName||`Context`)+`.Consumer`;case w:var t=e.render;return e=e.displayName,e||=(e=t.displayName||t.name||``,e===``?`ForwardRef`:`ForwardRef(`+e+`)`),e;case ee:return t=e.displayName||null,t===null?oe(e.type)||`Memo`:t;case D:t=e._payload,e=e._init;try{return oe(e(t))}catch{}}return null}var se=Array.isArray,O=n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,k=r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,ce={pending:!1,data:null,method:null,action:null},le=[],ue=-1;function de(e){return{current:e}}function A(e){0>ue||(e.current=le[ue],le[ue]=null,ue--)}function j(e,t){ue++,le[ue]=e.current,e.current=t}var fe=de(null),M=de(null),N=de(null),pe=de(null);function me(e,t){switch(j(N,t),j(M,e),j(fe,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?Vd(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=Vd(t),e=Hd(t,e);else switch(e){case`svg`:e=1;break;case`math`:e=2;break;default:e=0}}A(fe),j(fe,e)}function he(){A(fe),A(M),A(N)}function ge(e){e.memoizedState!==null&&j(pe,e);var t=fe.current,n=Hd(t,e.type);t!==n&&(j(M,e),j(fe,n))}function _e(e){M.current===e&&(A(fe),A(M)),pe.current===e&&(A(pe),Qf._currentValue=ce)}var ve,ye;function be(e){if(ve===void 0)try{throw Error()}catch(e){var t=e.stack.trim().match(/\n( *(at )?)/);ve=t&&t[1]||``,ye=-1<e.stack.indexOf(`
    at`)?` (<anonymous>)`:-1<e.stack.indexOf(`@`)?`@unknown:0:0`:``}return`
`+ve+e+ye}var xe=!1;function Se(e,t){if(!e||xe)return``;xe=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var r={DetermineComponentFrameRoot:function(){try{if(t){var n=function(){throw Error()};if(Object.defineProperty(n.prototype,"props",{set:function(){throw Error()}}),typeof Reflect==`object`&&Reflect.construct){try{Reflect.construct(n,[])}catch(e){var r=e}Reflect.construct(e,[],n)}else{try{n.call()}catch(e){r=e}e.call(n.prototype)}}else{try{throw Error()}catch(e){r=e}(n=e())&&typeof n.catch==`function`&&n.catch(function(){})}}catch(e){if(e&&r&&typeof e.stack==`string`)return[e.stack,r.stack]}return[null,null]}};r.DetermineComponentFrameRoot.displayName=`DetermineComponentFrameRoot`;var i=Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot,`name`);i&&i.configurable&&Object.defineProperty(r.DetermineComponentFrameRoot,"name",{value:`DetermineComponentFrameRoot`});var a=r.DetermineComponentFrameRoot(),o=a[0],s=a[1];if(o&&s){var c=o.split(`
`),l=s.split(`
`);for(i=r=0;r<c.length&&!c[r].includes(`DetermineComponentFrameRoot`);)r++;for(;i<l.length&&!l[i].includes(`DetermineComponentFrameRoot`);)i++;if(r===c.length||i===l.length)for(r=c.length-1,i=l.length-1;1<=r&&0<=i&&c[r]!==l[i];)i--;for(;1<=r&&0<=i;r--,i--)if(c[r]!==l[i]){if(r!==1||i!==1)do if(r--,i--,0>i||c[r]!==l[i]){var u=`
`+c[r].replace(` at new `,` at `);return e.displayName&&u.includes(`<anonymous>`)&&(u=u.replace(`<anonymous>`,e.displayName)),u}while(1<=r&&0<=i);break}}}finally{xe=!1,Error.prepareStackTrace=n}return(n=e?e.displayName||e.name:``)?be(n):``}function Ce(e,t){switch(e.tag){case 26:case 27:case 5:return be(e.type);case 16:return be(`Lazy`);case 13:return e.child!==t&&t!==null?be(`Suspense Fallback`):be(`Suspense`);case 19:return be(`SuspenseList`);case 0:case 15:return Se(e.type,!1);case 11:return Se(e.type.render,!1);case 1:return Se(e.type,!0);case 31:return be(`Activity`);default:return``}}function we(e){try{var t=``,n=null;do t+=Ce(e,n),n=e,e=e.return;while(e);return t}catch(e){return`
Error generating stack: `+e.message+`
`+e.stack}}var Te=Object.prototype.hasOwnProperty,Ee=t.unstable_scheduleCallback,De=t.unstable_cancelCallback,Oe=t.unstable_shouldYield,ke=t.unstable_requestPaint,Ae=t.unstable_now,je=t.unstable_getCurrentPriorityLevel,Me=t.unstable_ImmediatePriority,Ne=t.unstable_UserBlockingPriority,Pe=t.unstable_NormalPriority,Fe=t.unstable_LowPriority,Ie=t.unstable_IdlePriority,Le=t.log,Re=t.unstable_setDisableYieldValue,ze=null,Be=null;function Ve(e){if(typeof Le==`function`&&Re(e),Be&&typeof Be.setStrictMode==`function`)try{Be.setStrictMode(ze,e)}catch{}}var He=Math.clz32?Math.clz32:Ge,Ue=Math.log,We=Math.LN2;function Ge(e){return e>>>=0,e===0?32:31-(Ue(e)/We|0)|0}var Ke=256,qe=262144,Je=4194304;function Ye(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&261888;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function Xe(e,t,n){var r=e.pendingLanes;if(r===0)return 0;var i=0,a=e.suspendedLanes,o=e.pingedLanes;e=e.warmLanes;var s=r&134217727;return s===0?(s=r&~a,s===0?o===0?n||(n=r&~e,n!==0&&(i=Ye(n))):i=Ye(o):i=Ye(s)):(r=s&~a,r===0?(o&=s,o===0?n||(n=s&~e,n!==0&&(i=Ye(n))):i=Ye(o)):i=Ye(r)),i===0?0:t!==0&&t!==i&&(t&a)===0&&(a=i&-i,n=t&-t,a>=n||a===32&&n&4194048)?t:i}function Ze(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function Qe(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function $e(){var e=Je;return Je<<=1,!(Je&62914560)&&(Je=4194304),e}function et(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function tt(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function nt(e,t,n,r,i,a){var o=e.pendingLanes;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=n,e.entangledLanes&=n,e.errorRecoveryDisabledLanes&=n,e.shellSuspendCounter=0;var s=e.entanglements,c=e.expirationTimes,l=e.hiddenUpdates;for(n=o&~n;0<n;){var u=31-He(n),d=1<<u;s[u]=0,c[u]=-1;var f=l[u];if(f!==null)for(l[u]=null,u=0;u<f.length;u++){var p=f[u];p!==null&&(p.lane&=-536870913)}n&=~d}r!==0&&rt(e,r,0),a!==0&&i===0&&e.tag!==0&&(e.suspendedLanes|=a&~(o&~t))}function rt(e,t,n){e.pendingLanes|=t,e.suspendedLanes&=~t;var r=31-He(t);e.entangledLanes|=t,e.entanglements[r]=e.entanglements[r]|1073741824|n&261930}function it(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var r=31-He(n),i=1<<r;i&t|e[r]&t&&(e[r]|=t),n&=~i}}function at(e,t){var n=t&-t;return n=n&42?1:ot(n),(n&(e.suspendedLanes|t))===0?n:0}function ot(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function st(e){return e&=-e,2<e?8<e?e&134217727?32:268435456:8:2}function ct(){var e=k.p;return e===0?(e=window.event,e===void 0?32:mp(e.type)):e}function lt(e,t){var n=k.p;try{return k.p=e,t()}finally{k.p=n}}var ut=Math.random().toString(36).slice(2),dt=`__reactFiber$`+ut,ft=`__reactProps$`+ut,pt=`__reactContainer$`+ut,mt=`__reactEvents$`+ut,ht=`__reactListeners$`+ut,gt=`__reactHandles$`+ut,_t=`__reactResources$`+ut,vt=`__reactMarker$`+ut;function yt(e){delete e[dt],delete e[ft],delete e[mt],delete e[ht],delete e[gt]}function bt(e){var t=e[dt];if(t)return t;for(var n=e.parentNode;n;){if(t=n[pt]||n[dt]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=df(e);e!==null;){if(n=e[dt])return n;e=df(e)}return t}e=n,n=e.parentNode}return null}function xt(e){if(e=e[dt]||e[pt]){var t=e.tag;if(t===5||t===6||t===13||t===31||t===26||t===27||t===3)return e}return null}function St(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(i(33))}function Ct(e){var t=e[_t];return t||=e[_t]={hoistableStyles:new Map,hoistableScripts:new Map},t}function wt(e){e[vt]=!0}var Tt=new Set,Et={};function Dt(e,t){Ot(e,t),Ot(e+`Capture`,t)}function Ot(e,t){for(Et[e]=t,e=0;e<t.length;e++)Tt.add(t[e])}var kt=RegExp(`^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$`),At={},jt={};function Mt(e){return Te.call(jt,e)?!0:Te.call(At,e)?!1:kt.test(e)?jt[e]=!0:(At[e]=!0,!1)}function Nt(e,t,n){if(Mt(t))if(n===null)e.removeAttribute(t);else{switch(typeof n){case`undefined`:case`function`:case`symbol`:e.removeAttribute(t);return;case`boolean`:var r=t.toLowerCase().slice(0,5);if(r!==`data-`&&r!==`aria-`){e.removeAttribute(t);return}}e.setAttribute(t,``+n)}}function Pt(e,t,n){if(n===null)e.removeAttribute(t);else{switch(typeof n){case`undefined`:case`function`:case`symbol`:case`boolean`:e.removeAttribute(t);return}e.setAttribute(t,``+n)}}function Ft(e,t,n,r){if(r===null)e.removeAttribute(n);else{switch(typeof r){case`undefined`:case`function`:case`symbol`:case`boolean`:e.removeAttribute(n);return}e.setAttributeNS(t,n,``+r)}}function It(e){switch(typeof e){case`bigint`:case`boolean`:case`number`:case`string`:case`undefined`:return e;case`object`:return e;default:return``}}function Lt(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()===`input`&&(t===`checkbox`||t===`radio`)}function Rt(e,t,n){var r=Object.getOwnPropertyDescriptor(e.constructor.prototype,t);if(!e.hasOwnProperty(t)&&r!==void 0&&typeof r.get==`function`&&typeof r.set==`function`){var i=r.get,a=r.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return i.call(this)},set:function(e){n=``+e,a.call(this,e)}}),Object.defineProperty(e,t,{enumerable:r.enumerable}),{getValue:function(){return n},setValue:function(e){n=``+e},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function zt(e){if(!e._valueTracker){var t=Lt(e)?`checked`:`value`;e._valueTracker=Rt(e,t,``+e[t])}}function Bt(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),r=``;return e&&(r=Lt(e)?e.checked?`true`:`false`:e.value),e=r,e===n?!1:(t.setValue(e),!0)}function Vt(e){if(e||=typeof document<`u`?document:void 0,e===void 0)return null;try{return e.activeElement||e.body}catch{return e.body}}var Ht=/[\n"\\]/g;function Ut(e){return e.replace(Ht,function(e){return`\\`+e.charCodeAt(0).toString(16)+` `})}function Wt(e,t,n,r,i,a,o,s){e.name=``,o!=null&&typeof o!=`function`&&typeof o!=`symbol`&&typeof o!=`boolean`?e.type=o:e.removeAttribute(`type`),t==null?o!==`submit`&&o!==`reset`||e.removeAttribute(`value`):o===`number`?(t===0&&e.value===``||e.value!=t)&&(e.value=``+It(t)):e.value!==``+It(t)&&(e.value=``+It(t)),t==null?n==null?r!=null&&e.removeAttribute(`value`):Kt(e,o,It(n)):Kt(e,o,It(t)),i==null&&a!=null&&(e.defaultChecked=!!a),i!=null&&(e.checked=i&&typeof i!=`function`&&typeof i!=`symbol`),s!=null&&typeof s!=`function`&&typeof s!=`symbol`&&typeof s!=`boolean`?e.name=``+It(s):e.removeAttribute(`name`)}function Gt(e,t,n,r,i,a,o,s){if(a!=null&&typeof a!=`function`&&typeof a!=`symbol`&&typeof a!=`boolean`&&(e.type=a),t!=null||n!=null){if(!(a!==`submit`&&a!==`reset`||t!=null)){zt(e);return}n=n==null?``:``+It(n),t=t==null?n:``+It(t),s||t===e.value||(e.value=t),e.defaultValue=t}r??=i,r=typeof r!=`function`&&typeof r!=`symbol`&&!!r,e.checked=s?e.checked:!!r,e.defaultChecked=!!r,o!=null&&typeof o!=`function`&&typeof o!=`symbol`&&typeof o!=`boolean`&&(e.name=o),zt(e)}function Kt(e,t,n){t===`number`&&Vt(e.ownerDocument)===e||e.defaultValue===``+n||(e.defaultValue=``+n)}function qt(e,t,n,r){if(e=e.options,t){t={};for(var i=0;i<n.length;i++)t[`$`+n[i]]=!0;for(n=0;n<e.length;n++)i=t.hasOwnProperty(`$`+e[n].value),e[n].selected!==i&&(e[n].selected=i),i&&r&&(e[n].defaultSelected=!0)}else{for(n=``+It(n),t=null,i=0;i<e.length;i++){if(e[i].value===n){e[i].selected=!0,r&&(e[i].defaultSelected=!0);return}t!==null||e[i].disabled||(t=e[i])}t!==null&&(t.selected=!0)}}function P(e,t,n){if(t!=null&&(t=``+It(t),t!==e.value&&(e.value=t),n==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=n==null?``:``+It(n)}function F(e,t,n,r){if(t==null){if(r!=null){if(n!=null)throw Error(i(92));if(se(r)){if(1<r.length)throw Error(i(93));r=r[0]}n=r}n??=``,t=n}n=It(t),e.defaultValue=n,r=e.textContent,r===n&&r!==``&&r!==null&&(e.value=r),zt(e)}function I(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var Jt=new Set(`animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp`.split(` `));function Yt(e,t,n){var r=t.indexOf(`--`)===0;n==null||typeof n==`boolean`||n===``?r?e.setProperty(t,``):t===`float`?e.cssFloat=``:e[t]=``:r?e.setProperty(t,n):typeof n!=`number`||n===0||Jt.has(t)?t===`float`?e.cssFloat=n:e[t]=(``+n).trim():e[t]=n+`px`}function Xt(e,t,n){if(t!=null&&typeof t!=`object`)throw Error(i(62));if(e=e.style,n!=null){for(var r in n)!n.hasOwnProperty(r)||t!=null&&t.hasOwnProperty(r)||(r.indexOf(`--`)===0?e.setProperty(r,``):r===`float`?e.cssFloat=``:e[r]=``);for(var a in t)r=t[a],t.hasOwnProperty(a)&&n[a]!==r&&Yt(e,a,r)}else for(var o in t)t.hasOwnProperty(o)&&Yt(e,o,t[o])}function Zt(e){if(e.indexOf(`-`)===-1)return!1;switch(e){case`annotation-xml`:case`color-profile`:case`font-face`:case`font-face-src`:case`font-face-uri`:case`font-face-format`:case`font-face-name`:case`missing-glyph`:return!1;default:return!0}}var L=new Map([[`acceptCharset`,`accept-charset`],[`htmlFor`,`for`],[`httpEquiv`,`http-equiv`],[`crossOrigin`,`crossorigin`],[`accentHeight`,`accent-height`],[`alignmentBaseline`,`alignment-baseline`],[`arabicForm`,`arabic-form`],[`baselineShift`,`baseline-shift`],[`capHeight`,`cap-height`],[`clipPath`,`clip-path`],[`clipRule`,`clip-rule`],[`colorInterpolation`,`color-interpolation`],[`colorInterpolationFilters`,`color-interpolation-filters`],[`colorProfile`,`color-profile`],[`colorRendering`,`color-rendering`],[`dominantBaseline`,`dominant-baseline`],[`enableBackground`,`enable-background`],[`fillOpacity`,`fill-opacity`],[`fillRule`,`fill-rule`],[`floodColor`,`flood-color`],[`floodOpacity`,`flood-opacity`],[`fontFamily`,`font-family`],[`fontSize`,`font-size`],[`fontSizeAdjust`,`font-size-adjust`],[`fontStretch`,`font-stretch`],[`fontStyle`,`font-style`],[`fontVariant`,`font-variant`],[`fontWeight`,`font-weight`],[`glyphName`,`glyph-name`],[`glyphOrientationHorizontal`,`glyph-orientation-horizontal`],[`glyphOrientationVertical`,`glyph-orientation-vertical`],[`horizAdvX`,`horiz-adv-x`],[`horizOriginX`,`horiz-origin-x`],[`imageRendering`,`image-rendering`],[`letterSpacing`,`letter-spacing`],[`lightingColor`,`lighting-color`],[`markerEnd`,`marker-end`],[`markerMid`,`marker-mid`],[`markerStart`,`marker-start`],[`overlinePosition`,`overline-position`],[`overlineThickness`,`overline-thickness`],[`paintOrder`,`paint-order`],[`panose-1`,`panose-1`],[`pointerEvents`,`pointer-events`],[`renderingIntent`,`rendering-intent`],[`shapeRendering`,`shape-rendering`],[`stopColor`,`stop-color`],[`stopOpacity`,`stop-opacity`],[`strikethroughPosition`,`strikethrough-position`],[`strikethroughThickness`,`strikethrough-thickness`],[`strokeDasharray`,`stroke-dasharray`],[`strokeDashoffset`,`stroke-dashoffset`],[`strokeLinecap`,`stroke-linecap`],[`strokeLinejoin`,`stroke-linejoin`],[`strokeMiterlimit`,`stroke-miterlimit`],[`strokeOpacity`,`stroke-opacity`],[`strokeWidth`,`stroke-width`],[`textAnchor`,`text-anchor`],[`textDecoration`,`text-decoration`],[`textRendering`,`text-rendering`],[`transformOrigin`,`transform-origin`],[`underlinePosition`,`underline-position`],[`underlineThickness`,`underline-thickness`],[`unicodeBidi`,`unicode-bidi`],[`unicodeRange`,`unicode-range`],[`unitsPerEm`,`units-per-em`],[`vAlphabetic`,`v-alphabetic`],[`vHanging`,`v-hanging`],[`vIdeographic`,`v-ideographic`],[`vMathematical`,`v-mathematical`],[`vectorEffect`,`vector-effect`],[`vertAdvY`,`vert-adv-y`],[`vertOriginX`,`vert-origin-x`],[`vertOriginY`,`vert-origin-y`],[`wordSpacing`,`word-spacing`],[`writingMode`,`writing-mode`],[`xmlnsXlink`,`xmlns:xlink`],[`xHeight`,`x-height`]]),Qt=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function $t(e){return Qt.test(``+e)?`javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')`:e}function en(){}var tn=null;function nn(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var rn=null,an=null;function on(e){var t=xt(e);if(t&&(e=t.stateNode)){var n=e[ft]||null;a:switch(e=t.stateNode,t.type){case`input`:if(Wt(e,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name),t=n.name,n.type===`radio`&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll(`input[name="`+Ut(``+t)+`"][type="radio"]`),t=0;t<n.length;t++){var r=n[t];if(r!==e&&r.form===e.form){var a=r[ft]||null;if(!a)throw Error(i(90));Wt(r,a.value,a.defaultValue,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name)}}for(t=0;t<n.length;t++)r=n[t],r.form===e.form&&Bt(r)}break a;case`textarea`:P(e,n.value,n.defaultValue);break a;case`select`:t=n.value,t!=null&&qt(e,!!n.multiple,t,!1)}}}var sn=!1;function cn(e,t,n){if(sn)return e(t,n);sn=!0;try{return e(t)}finally{if(sn=!1,(rn!==null||an!==null)&&(bu(),rn&&(t=rn,e=an,an=rn=null,on(t),e)))for(t=0;t<e.length;t++)on(e[t])}}function ln(e,t){var n=e.stateNode;if(n===null)return null;var r=n[ft]||null;if(r===null)return null;n=r[t];a:switch(t){case`onClick`:case`onClickCapture`:case`onDoubleClick`:case`onDoubleClickCapture`:case`onMouseDown`:case`onMouseDownCapture`:case`onMouseMove`:case`onMouseMoveCapture`:case`onMouseUp`:case`onMouseUpCapture`:case`onMouseEnter`:(r=!r.disabled)||(e=e.type,r=!(e===`button`||e===`input`||e===`select`||e===`textarea`)),e=!r;break a;default:e=!1}if(e)return null;if(n&&typeof n!=`function`)throw Error(i(231,t,typeof n));return n}var un=!(typeof window>`u`||window.document===void 0||window.document.createElement===void 0),dn=!1;if(un)try{var fn={};Object.defineProperty(fn,"passive",{get:function(){dn=!0}}),window.addEventListener(`test`,fn,fn),window.removeEventListener(`test`,fn,fn)}catch{dn=!1}var pn=null,mn=null,hn=null;function gn(){if(hn)return hn;var e,t=mn,n=t.length,r,i=`value`in pn?pn.value:pn.textContent,a=i.length;for(e=0;e<n&&t[e]===i[e];e++);var o=n-e;for(r=1;r<=o&&t[n-r]===i[a-r];r++);return hn=i.slice(e,1<r?1-r:void 0)}function _n(e){var t=e.keyCode;return`charCode`in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function vn(){return!0}function yn(){return!1}function bn(e){function t(t,n,r,i,a){for(var o in this._reactName=t,this._targetInst=r,this.type=n,this.nativeEvent=i,this.target=a,this.currentTarget=null,e)e.hasOwnProperty(o)&&(t=e[o],this[o]=t?t(i):i[o]);return this.isDefaultPrevented=(i.defaultPrevented==null?!1===i.returnValue:i.defaultPrevented)?vn:yn,this.isPropagationStopped=yn,this}return m(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var e=this.nativeEvent;e&&(e.preventDefault?e.preventDefault():typeof e.returnValue!=`unknown`&&(e.returnValue=!1),this.isDefaultPrevented=vn)},stopPropagation:function(){var e=this.nativeEvent;e&&(e.stopPropagation?e.stopPropagation():typeof e.cancelBubble!=`unknown`&&(e.cancelBubble=!0),this.isPropagationStopped=vn)},persist:function(){},isPersistent:vn}),t}var xn={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Sn=bn(xn),Cn=m({},xn,{view:0,detail:0}),wn=bn(Cn),Tn,En,Dn,On=m({},Cn,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:zn,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return`movementX`in e?e.movementX:(e!==Dn&&(Dn&&e.type===`mousemove`?(Tn=e.screenX-Dn.screenX,En=e.screenY-Dn.screenY):En=Tn=0,Dn=e),Tn)},movementY:function(e){return`movementY`in e?e.movementY:En}}),kn=bn(On),An=bn(m({},On,{dataTransfer:0})),jn=bn(m({},Cn,{relatedTarget:0})),Mn=bn(m({},xn,{animationName:0,elapsedTime:0,pseudoElement:0})),Nn=bn(m({},xn,{clipboardData:function(e){return`clipboardData`in e?e.clipboardData:window.clipboardData}})),Pn=bn(m({},xn,{data:0})),Fn={Esc:`Escape`,Spacebar:` `,Left:`ArrowLeft`,Up:`ArrowUp`,Right:`ArrowRight`,Down:`ArrowDown`,Del:`Delete`,Win:`OS`,Menu:`ContextMenu`,Apps:`ContextMenu`,Scroll:`ScrollLock`,MozPrintableKey:`Unidentified`},In={8:`Backspace`,9:`Tab`,12:`Clear`,13:`Enter`,16:`Shift`,17:`Control`,18:`Alt`,19:`Pause`,20:`CapsLock`,27:`Escape`,32:` `,33:`PageUp`,34:`PageDown`,35:`End`,36:`Home`,37:`ArrowLeft`,38:`ArrowUp`,39:`ArrowRight`,40:`ArrowDown`,45:`Insert`,46:`Delete`,112:`F1`,113:`F2`,114:`F3`,115:`F4`,116:`F5`,117:`F6`,118:`F7`,119:`F8`,120:`F9`,121:`F10`,122:`F11`,123:`F12`,144:`NumLock`,145:`ScrollLock`,224:`Meta`},Ln={Alt:`altKey`,Control:`ctrlKey`,Meta:`metaKey`,Shift:`shiftKey`};function Rn(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=Ln[e])?!!t[e]:!1}function zn(){return Rn}var Bn=bn(m({},Cn,{key:function(e){if(e.key){var t=Fn[e.key]||e.key;if(t!==`Unidentified`)return t}return e.type===`keypress`?(e=_n(e),e===13?`Enter`:String.fromCharCode(e)):e.type===`keydown`||e.type===`keyup`?In[e.keyCode]||`Unidentified`:``},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:zn,charCode:function(e){return e.type===`keypress`?_n(e):0},keyCode:function(e){return e.type===`keydown`||e.type===`keyup`?e.keyCode:0},which:function(e){return e.type===`keypress`?_n(e):e.type===`keydown`||e.type===`keyup`?e.keyCode:0}})),Vn=bn(m({},On,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0})),Hn=bn(m({},Cn,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:zn})),Un=bn(m({},xn,{propertyName:0,elapsedTime:0,pseudoElement:0})),Wn=bn(m({},On,{deltaX:function(e){return`deltaX`in e?e.deltaX:`wheelDeltaX`in e?-e.wheelDeltaX:0},deltaY:function(e){return`deltaY`in e?e.deltaY:`wheelDeltaY`in e?-e.wheelDeltaY:`wheelDelta`in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0})),Gn=bn(m({},xn,{newState:0,oldState:0})),Kn=[9,13,27,32],qn=un&&`CompositionEvent`in window,Jn=null;un&&`documentMode`in document&&(Jn=document.documentMode);var Yn=un&&`TextEvent`in window&&!Jn,Xn=un&&(!qn||Jn&&8<Jn&&11>=Jn),Zn=` `,Qn=!1;function $n(e,t){switch(e){case`keyup`:return Kn.indexOf(t.keyCode)!==-1;case`keydown`:return t.keyCode!==229;case`keypress`:case`mousedown`:case`focusout`:return!0;default:return!1}}function er(e){return e=e.detail,typeof e==`object`&&`data`in e?e.data:null}var tr=!1;function nr(e,t){switch(e){case`compositionend`:return er(t);case`keypress`:return t.which===32?(Qn=!0,Zn):null;case`textInput`:return e=t.data,e===Zn&&Qn?null:e;default:return null}}function rr(e,t){if(tr)return e===`compositionend`||!qn&&$n(e,t)?(e=gn(),hn=mn=pn=null,tr=!1,e):null;switch(e){case`paste`:return null;case`keypress`:if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case`compositionend`:return Xn&&t.locale!==`ko`?null:t.data;default:return null}}var ir={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function ar(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t===`input`?!!ir[e.type]:t===`textarea`}function or(e,t,n,r){rn?an?an.push(r):an=[r]:rn=r,t=Ed(t,`onChange`),0<t.length&&(n=new Sn(`onChange`,`change`,null,n,r),e.push({event:n,listeners:t}))}var sr=null,cr=null;function lr(e){yd(e,0)}function ur(e){if(Bt(St(e)))return e}function dr(e,t){if(e===`change`)return t}var fr=!1;if(un){var pr;if(un){var mr=`oninput`in document;if(!mr){var hr=document.createElement(`div`);hr.setAttribute(`oninput`,`return;`),mr=typeof hr.oninput==`function`}pr=mr}else pr=!1;fr=pr&&(!document.documentMode||9<document.documentMode)}function gr(){sr&&(sr.detachEvent(`onpropertychange`,_r),cr=sr=null)}function _r(e){if(e.propertyName===`value`&&ur(cr)){var t=[];or(t,cr,e,nn(e)),cn(lr,t)}}function vr(e,t,n){e===`focusin`?(gr(),sr=t,cr=n,sr.attachEvent(`onpropertychange`,_r)):e===`focusout`&&gr()}function yr(e){if(e===`selectionchange`||e===`keyup`||e===`keydown`)return ur(cr)}function br(e,t){if(e===`click`)return ur(t)}function xr(e,t){if(e===`input`||e===`change`)return ur(t)}function Sr(e,t){return e===t&&(e!==0||1/e==1/t)||e!==e&&t!==t}var Cr=typeof Object.is==`function`?Object.is:Sr;function wr(e,t){if(Cr(e,t))return!0;if(typeof e!=`object`||!e||typeof t!=`object`||!t)return!1;var n=Object.keys(e),r=Object.keys(t);if(n.length!==r.length)return!1;for(r=0;r<n.length;r++){var i=n[r];if(!Te.call(t,i)||!Cr(e[i],t[i]))return!1}return!0}function Tr(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Er(e,t){var n=Tr(e);e=0;for(var r;n;){if(n.nodeType===3){if(r=e+n.textContent.length,e<=t&&r>=t)return{node:n,offset:t-e};e=r}a:{for(;n;){if(n.nextSibling){n=n.nextSibling;break a}n=n.parentNode}n=void 0}n=Tr(n)}}function Dr(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?Dr(e,t.parentNode):`contains`in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function Or(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=Vt(e.document);t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href==`string`}catch{n=!1}if(n)e=t.contentWindow;else break;t=Vt(e.document)}return t}function kr(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t===`input`&&(e.type===`text`||e.type===`search`||e.type===`tel`||e.type===`url`||e.type===`password`)||t===`textarea`||e.contentEditable===`true`)}var Ar=un&&`documentMode`in document&&11>=document.documentMode,jr=null,Mr=null,Nr=null,Pr=!1;function Fr(e,t,n){var r=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;Pr||jr==null||jr!==Vt(r)||(r=jr,`selectionStart`in r&&kr(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),Nr&&wr(Nr,r)||(Nr=r,r=Ed(Mr,`onSelect`),0<r.length&&(t=new Sn(`onSelect`,`select`,null,t,n),e.push({event:t,listeners:r}),t.target=jr)))}function Ir(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n[`Webkit`+e]=`webkit`+t,n[`Moz`+e]=`moz`+t,n}var Lr={animationend:Ir(`Animation`,`AnimationEnd`),animationiteration:Ir(`Animation`,`AnimationIteration`),animationstart:Ir(`Animation`,`AnimationStart`),transitionrun:Ir(`Transition`,`TransitionRun`),transitionstart:Ir(`Transition`,`TransitionStart`),transitioncancel:Ir(`Transition`,`TransitionCancel`),transitionend:Ir(`Transition`,`TransitionEnd`)},Rr={},zr={};un&&(zr=document.createElement(`div`).style,`AnimationEvent`in window||(delete Lr.animationend.animation,delete Lr.animationiteration.animation,delete Lr.animationstart.animation),`TransitionEvent`in window||delete Lr.transitionend.transition);function Br(e){if(Rr[e])return Rr[e];if(!Lr[e])return e;var t=Lr[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in zr)return Rr[e]=t[n];return e}var Vr=Br(`animationend`),Hr=Br(`animationiteration`),Ur=Br(`animationstart`),Wr=Br(`transitionrun`),Gr=Br(`transitionstart`),Kr=Br(`transitioncancel`),qr=Br(`transitionend`),Jr=new Map,Yr=`abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel`.split(` `);Yr.push(`scrollEnd`);function Xr(e,t){Jr.set(e,t),Dt(t,[e])}var Zr=typeof reportError==`function`?reportError:function(e){if(typeof window==`object`&&typeof window.ErrorEvent==`function`){var t=new window.ErrorEvent(`error`,{bubbles:!0,cancelable:!0,message:typeof e==`object`&&e&&typeof e.message==`string`?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process==`object`&&typeof process.emit==`function`){process.emit(`uncaughtException`,e);return}console.error(e)},Qr=[],$r=0,ei=0;function ti(){for(var e=$r,t=ei=$r=0;t<e;){var n=Qr[t];Qr[t++]=null;var r=Qr[t];Qr[t++]=null;var i=Qr[t];Qr[t++]=null;var a=Qr[t];if(Qr[t++]=null,r!==null&&i!==null){var o=r.pending;o===null?i.next=i:(i.next=o.next,o.next=i),r.pending=i}a!==0&&ai(n,i,a)}}function ni(e,t,n,r){Qr[$r++]=e,Qr[$r++]=t,Qr[$r++]=n,Qr[$r++]=r,ei|=r,e.lanes|=r,e=e.alternate,e!==null&&(e.lanes|=r)}function ri(e,t,n,r){return ni(e,t,n,r),oi(e)}function ii(e,t){return ni(e,null,null,t),oi(e)}function ai(e,t,n){e.lanes|=n;var r=e.alternate;r!==null&&(r.lanes|=n);for(var i=!1,a=e.return;a!==null;)a.childLanes|=n,r=a.alternate,r!==null&&(r.childLanes|=n),a.tag===22&&(e=a.stateNode,e===null||e._visibility&1||(i=!0)),e=a,a=a.return;return e.tag===3?(a=e.stateNode,i&&t!==null&&(i=31-He(n),e=a.hiddenUpdates,r=e[i],r===null?e[i]=[t]:r.push(t),t.lane=n|536870912),a):null}function oi(e){if(50<du)throw du=0,fu=null,Error(i(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var si={};function ci(e,t,n,r){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function li(e,t,n,r){return new ci(e,t,n,r)}function ui(e){return e=e.prototype,!(!e||!e.isReactComponent)}function di(e,t){var n=e.alternate;return n===null?(n=li(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&65011712,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n.refCleanup=e.refCleanup,n}function fi(e,t){e.flags&=65011714;var n=e.alternate;return n===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=n.childLanes,e.lanes=n.lanes,e.child=n.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=n.memoizedProps,e.memoizedState=n.memoizedState,e.updateQueue=n.updateQueue,e.type=n.type,t=n.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function pi(e,t,n,r,a,o){var s=0;if(r=e,typeof e==`function`)ui(e)&&(s=1);else if(typeof e==`string`)s=Uf(e,n,fe.current)?26:e===`html`||e===`head`||e===`body`?27:5;else a:switch(e){case te:return e=li(31,n,t,a),e.elementType=te,e.lanes=o,e;case y:return mi(n.children,a,o,t);case b:s=8,a|=24;break;case x:return e=li(12,n,t,a|2),e.elementType=x,e.lanes=o,e;case T:return e=li(13,n,t,a),e.elementType=T,e.lanes=o,e;case E:return e=li(19,n,t,a),e.elementType=E,e.lanes=o,e;default:if(typeof e==`object`&&e)switch(e.$$typeof){case C:s=10;break a;case S:s=9;break a;case w:s=11;break a;case ee:s=14;break a;case D:s=16,r=null;break a}s=29,n=Error(i(130,e===null?`null`:typeof e,``)),r=null}return t=li(s,n,t,a),t.elementType=e,t.type=r,t.lanes=o,t}function mi(e,t,n,r){return e=li(7,e,r,t),e.lanes=n,e}function hi(e,t,n){return e=li(6,e,null,t),e.lanes=n,e}function gi(e){var t=li(18,null,null,0);return t.stateNode=e,t}function _i(e,t,n){return t=li(4,e.children===null?[]:e.children,e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var vi=new WeakMap;function yi(e,t){if(typeof e==`object`&&e){var n=vi.get(e);return n===void 0?(t={value:e,source:t,stack:we(t)},vi.set(e,t),t):n}return{value:e,source:t,stack:we(t)}}var bi=[],xi=0,Si=null,Ci=0,wi=[],Ti=0,Ei=null,Di=1,Oi=``;function ki(e,t){bi[xi++]=Ci,bi[xi++]=Si,Si=e,Ci=t}function Ai(e,t,n){wi[Ti++]=Di,wi[Ti++]=Oi,wi[Ti++]=Ei,Ei=e;var r=Di;e=Oi;var i=32-He(r)-1;r&=~(1<<i),n+=1;var a=32-He(t)+i;if(30<a){var o=i-i%5;a=(r&(1<<o)-1).toString(32),r>>=o,i-=o,Di=1<<32-He(t)+i|n<<i|r,Oi=a+e}else Di=1<<a|n<<i|r,Oi=e}function ji(e){e.return!==null&&(ki(e,1),Ai(e,1,0))}function Mi(e){for(;e===Si;)Si=bi[--xi],bi[xi]=null,Ci=bi[--xi],bi[xi]=null;for(;e===Ei;)Ei=wi[--Ti],wi[Ti]=null,Oi=wi[--Ti],wi[Ti]=null,Di=wi[--Ti],wi[Ti]=null}function Ni(e,t){wi[Ti++]=Di,wi[Ti++]=Oi,wi[Ti++]=Ei,Di=t.id,Oi=t.overflow,Ei=e}var Pi=null,R=null,z=!1,Fi=null,Ii=!1,Li=Error(i(519));function Ri(e){throw Wi(yi(Error(i(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?`text`:`HTML`,``)),e)),Li}function zi(e){var t=e.stateNode,n=e.type,r=e.memoizedProps;switch(t[dt]=e,t[ft]=r,n){case`dialog`:Q(`cancel`,t),Q(`close`,t);break;case`iframe`:case`object`:case`embed`:Q(`load`,t);break;case`video`:case`audio`:for(n=0;n<_d.length;n++)Q(_d[n],t);break;case`source`:Q(`error`,t);break;case`img`:case`image`:case`link`:Q(`error`,t),Q(`load`,t);break;case`details`:Q(`toggle`,t);break;case`input`:Q(`invalid`,t),Gt(t,r.value,r.defaultValue,r.checked,r.defaultChecked,r.type,r.name,!0);break;case`select`:Q(`invalid`,t);break;case`textarea`:Q(`invalid`,t),F(t,r.value,r.defaultValue,r.children)}n=r.children,typeof n!=`string`&&typeof n!=`number`&&typeof n!=`bigint`||t.textContent===``+n||!0===r.suppressHydrationWarning||Md(t.textContent,n)?(r.popover!=null&&(Q(`beforetoggle`,t),Q(`toggle`,t)),r.onScroll!=null&&Q(`scroll`,t),r.onScrollEnd!=null&&Q(`scrollend`,t),r.onClick!=null&&(t.onclick=en),t=!0):t=!1,t||Ri(e,!0)}function Bi(e){for(Pi=e.return;Pi;)switch(Pi.tag){case 5:case 31:case 13:Ii=!1;return;case 27:case 3:Ii=!0;return;default:Pi=Pi.return}}function Vi(e){if(e!==Pi)return!1;if(!z)return Bi(e),z=!0,!1;var t=e.tag,n;if((n=t!==3&&t!==27)&&((n=t===5)&&(n=e.type,n=!(n!==`form`&&n!==`button`)||Ud(e.type,e.memoizedProps)),n=!n),n&&R&&Ri(e),Bi(e),t===13){if(e=e.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(i(317));R=uf(e)}else if(t===31){if(e=e.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(i(317));R=uf(e)}else t===27?(t=R,Zd(e.type)?(e=lf,lf=null,R=e):R=t):R=Pi?cf(e.stateNode.nextSibling):null;return!0}function Hi(){R=Pi=null,z=!1}function Ui(){var e=Fi;return e!==null&&(Zl===null?Zl=e:Zl.push.apply(Zl,e),Fi=null),e}function Wi(e){Fi===null?Fi=[e]:Fi.push(e)}var Gi=de(null),Ki=null,qi=null;function Ji(e,t,n){j(Gi,t._currentValue),t._currentValue=n}function Yi(e){e._currentValue=Gi.current,A(Gi)}function Xi(e,t,n){for(;e!==null;){var r=e.alternate;if((e.childLanes&t)===t?r!==null&&(r.childLanes&t)!==t&&(r.childLanes|=t):(e.childLanes|=t,r!==null&&(r.childLanes|=t)),e===n)break;e=e.return}}function Zi(e,t,n,r){var a=e.child;for(a!==null&&(a.return=e);a!==null;){var o=a.dependencies;if(o!==null){var s=a.child;o=o.firstContext;a:for(;o!==null;){var c=o;o=a;for(var l=0;l<t.length;l++)if(c.context===t[l]){o.lanes|=n,c=o.alternate,c!==null&&(c.lanes|=n),Xi(o.return,n,e),r||(s=null);break a}o=c.next}}else if(a.tag===18){if(s=a.return,s===null)throw Error(i(341));s.lanes|=n,o=s.alternate,o!==null&&(o.lanes|=n),Xi(s,n,e),s=null}else s=a.child;if(s!==null)s.return=a;else for(s=a;s!==null;){if(s===e){s=null;break}if(a=s.sibling,a!==null){a.return=s.return,s=a;break}s=s.return}a=s}}function Qi(e,t,n,r){e=null;for(var a=t,o=!1;a!==null;){if(!o){if(a.flags&524288)o=!0;else if(a.flags&262144)break}if(a.tag===10){var s=a.alternate;if(s===null)throw Error(i(387));if(s=s.memoizedProps,s!==null){var c=a.type;Cr(a.pendingProps.value,s.value)||(e===null?e=[c]:e.push(c))}}else if(a===pe.current){if(s=a.alternate,s===null)throw Error(i(387));s.memoizedState.memoizedState!==a.memoizedState.memoizedState&&(e===null?e=[Qf]:e.push(Qf))}a=a.return}e!==null&&Zi(t,e,n,r),t.flags|=262144}function $i(e){for(e=e.firstContext;e!==null;){if(!Cr(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function ea(e){Ki=e,qi=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function ta(e){return ra(Ki,e)}function na(e,t){return Ki===null&&ea(e),ra(e,t)}function ra(e,t){var n=t._currentValue;if(t={context:t,memoizedValue:n,next:null},qi===null){if(e===null)throw Error(i(308));qi=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else qi=qi.next=t;return n}var ia=typeof AbortController<`u`?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(t,n){e.push(n)}};this.abort=function(){t.aborted=!0,e.forEach(function(e){return e()})}},aa=t.unstable_scheduleCallback,oa=t.unstable_NormalPriority,sa={$$typeof:C,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function ca(){return{controller:new ia,data:new Map,refCount:0}}function la(e){e.refCount--,e.refCount===0&&aa(oa,function(){e.controller.abort()})}var ua=null,da=0,fa=0,pa=null;function ma(e,t){if(ua===null){var n=ua=[];da=0,fa=dd(),pa={status:`pending`,value:void 0,then:function(e){n.push(e)}}}return da++,t.then(ha,ha),t}function ha(){if(--da===0&&ua!==null){pa!==null&&(pa.status=`fulfilled`);var e=ua;ua=null,fa=0,pa=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function ga(e,t){var n=[],r={status:`pending`,value:null,reason:null,then:function(e){n.push(e)}};return e.then(function(){r.status=`fulfilled`,r.value=t;for(var e=0;e<n.length;e++)(0,n[e])(t)},function(e){for(r.status=`rejected`,r.reason=e,e=0;e<n.length;e++)(0,n[e])(void 0)}),r}var _a=O.S;O.S=function(e,t){eu=Ae(),typeof t==`object`&&t&&typeof t.then==`function`&&ma(e,t),_a!==null&&_a(e,t)};var va=de(null);function ya(){var e=va.current;return e===null?K.pooledCache:e}function ba(e,t){t===null?j(va,va.current):j(va,t.pool)}function xa(){var e=ya();return e===null?null:{parent:sa._currentValue,pool:e}}var Sa=Error(i(460)),Ca=Error(i(474)),wa=Error(i(542)),Ta={then:function(){}};function Ea(e){return e=e.status,e===`fulfilled`||e===`rejected`}function Da(e,t,n){switch(n=e[n],n===void 0?e.push(t):n!==t&&(t.then(en,en),t=n),t.status){case`fulfilled`:return t.value;case`rejected`:throw e=t.reason,ja(e),e;default:if(typeof t.status==`string`)t.then(en,en);else{if(e=K,e!==null&&100<e.shellSuspendCounter)throw Error(i(482));e=t,e.status=`pending`,e.then(function(e){if(t.status===`pending`){var n=t;n.status=`fulfilled`,n.value=e}},function(e){if(t.status===`pending`){var n=t;n.status=`rejected`,n.reason=e}})}switch(t.status){case`fulfilled`:return t.value;case`rejected`:throw e=t.reason,ja(e),e}throw ka=t,Sa}}function Oa(e){try{var t=e._init;return t(e._payload)}catch(e){throw typeof e==`object`&&e&&typeof e.then==`function`?(ka=e,Sa):e}}var ka=null;function Aa(){if(ka===null)throw Error(i(459));var e=ka;return ka=null,e}function ja(e){if(e===Sa||e===wa)throw Error(i(483))}var Ma=null,Na=0;function Pa(e){var t=Na;return Na+=1,Ma===null&&(Ma=[]),Da(Ma,e,t)}function Fa(e,t){t=t.props.ref,e.ref=t===void 0?null:t}function Ia(e,t){throw t.$$typeof===g?Error(i(525)):(e=Object.prototype.toString.call(t),Error(i(31,e===`[object Object]`?`object with keys {`+Object.keys(t).join(`, `)+`}`:e)))}function La(e){function t(t,n){if(e){var r=t.deletions;r===null?(t.deletions=[n],t.flags|=16):r.push(n)}}function n(n,r){if(!e)return null;for(;r!==null;)t(n,r),r=r.sibling;return null}function r(e){for(var t=new Map;e!==null;)e.key===null?t.set(e.index,e):t.set(e.key,e),e=e.sibling;return t}function a(e,t){return e=di(e,t),e.index=0,e.sibling=null,e}function o(t,n,r){return t.index=r,e?(r=t.alternate,r===null?(t.flags|=67108866,n):(r=r.index,r<n?(t.flags|=67108866,n):r)):(t.flags|=1048576,n)}function s(t){return e&&t.alternate===null&&(t.flags|=67108866),t}function c(e,t,n,r){return t===null||t.tag!==6?(t=hi(n,e.mode,r),t.return=e,t):(t=a(t,n),t.return=e,t)}function l(e,t,n,r){var i=n.type;return i===y?d(e,t,n.props.children,r,n.key):t!==null&&(t.elementType===i||typeof i==`object`&&i&&i.$$typeof===D&&Oa(i)===t.type)?(t=a(t,n.props),Fa(t,n),t.return=e,t):(t=pi(n.type,n.key,n.props,null,e.mode,r),Fa(t,n),t.return=e,t)}function u(e,t,n,r){return t===null||t.tag!==4||t.stateNode.containerInfo!==n.containerInfo||t.stateNode.implementation!==n.implementation?(t=_i(n,e.mode,r),t.return=e,t):(t=a(t,n.children||[]),t.return=e,t)}function d(e,t,n,r,i){return t===null||t.tag!==7?(t=mi(n,e.mode,r,i),t.return=e,t):(t=a(t,n),t.return=e,t)}function f(e,t,n){if(typeof t==`string`&&t!==``||typeof t==`number`||typeof t==`bigint`)return t=hi(``+t,e.mode,n),t.return=e,t;if(typeof t==`object`&&t){switch(t.$$typeof){case _:return n=pi(t.type,t.key,t.props,null,e.mode,n),Fa(n,t),n.return=e,n;case v:return t=_i(t,e.mode,n),t.return=e,t;case D:return t=Oa(t),f(e,t,n)}if(se(t)||ie(t))return t=mi(t,e.mode,n,null),t.return=e,t;if(typeof t.then==`function`)return f(e,Pa(t),n);if(t.$$typeof===C)return f(e,na(e,t),n);Ia(e,t)}return null}function p(e,t,n,r){var i=t===null?null:t.key;if(typeof n==`string`&&n!==``||typeof n==`number`||typeof n==`bigint`)return i===null?c(e,t,``+n,r):null;if(typeof n==`object`&&n){switch(n.$$typeof){case _:return n.key===i?l(e,t,n,r):null;case v:return n.key===i?u(e,t,n,r):null;case D:return n=Oa(n),p(e,t,n,r)}if(se(n)||ie(n))return i===null?d(e,t,n,r,null):null;if(typeof n.then==`function`)return p(e,t,Pa(n),r);if(n.$$typeof===C)return p(e,t,na(e,n),r);Ia(e,n)}return null}function m(e,t,n,r,i){if(typeof r==`string`&&r!==``||typeof r==`number`||typeof r==`bigint`)return e=e.get(n)||null,c(t,e,``+r,i);if(typeof r==`object`&&r){switch(r.$$typeof){case _:return e=e.get(r.key===null?n:r.key)||null,l(t,e,r,i);case v:return e=e.get(r.key===null?n:r.key)||null,u(t,e,r,i);case D:return r=Oa(r),m(e,t,n,r,i)}if(se(r)||ie(r))return e=e.get(n)||null,d(t,e,r,i,null);if(typeof r.then==`function`)return m(e,t,n,Pa(r),i);if(r.$$typeof===C)return m(e,t,n,na(t,r),i);Ia(t,r)}return null}function h(i,a,s,c){for(var l=null,u=null,d=a,h=a=0,g=null;d!==null&&h<s.length;h++){d.index>h?(g=d,d=null):g=d.sibling;var _=p(i,d,s[h],c);if(_===null){d===null&&(d=g);break}e&&d&&_.alternate===null&&t(i,d),a=o(_,a,h),u===null?l=_:u.sibling=_,u=_,d=g}if(h===s.length)return n(i,d),z&&ki(i,h),l;if(d===null){for(;h<s.length;h++)d=f(i,s[h],c),d!==null&&(a=o(d,a,h),u===null?l=d:u.sibling=d,u=d);return z&&ki(i,h),l}for(d=r(d);h<s.length;h++)g=m(d,i,h,s[h],c),g!==null&&(e&&g.alternate!==null&&d.delete(g.key===null?h:g.key),a=o(g,a,h),u===null?l=g:u.sibling=g,u=g);return e&&d.forEach(function(e){return t(i,e)}),z&&ki(i,h),l}function g(a,s,c,l){if(c==null)throw Error(i(151));for(var u=null,d=null,h=s,g=s=0,_=null,v=c.next();h!==null&&!v.done;g++,v=c.next()){h.index>g?(_=h,h=null):_=h.sibling;var y=p(a,h,v.value,l);if(y===null){h===null&&(h=_);break}e&&h&&y.alternate===null&&t(a,h),s=o(y,s,g),d===null?u=y:d.sibling=y,d=y,h=_}if(v.done)return n(a,h),z&&ki(a,g),u;if(h===null){for(;!v.done;g++,v=c.next())v=f(a,v.value,l),v!==null&&(s=o(v,s,g),d===null?u=v:d.sibling=v,d=v);return z&&ki(a,g),u}for(h=r(h);!v.done;g++,v=c.next())v=m(h,a,g,v.value,l),v!==null&&(e&&v.alternate!==null&&h.delete(v.key===null?g:v.key),s=o(v,s,g),d===null?u=v:d.sibling=v,d=v);return e&&h.forEach(function(e){return t(a,e)}),z&&ki(a,g),u}function b(e,r,o,c){if(typeof o==`object`&&o&&o.type===y&&o.key===null&&(o=o.props.children),typeof o==`object`&&o){switch(o.$$typeof){case _:a:{for(var l=o.key;r!==null;){if(r.key===l){if(l=o.type,l===y){if(r.tag===7){n(e,r.sibling),c=a(r,o.props.children),c.return=e,e=c;break a}}else if(r.elementType===l||typeof l==`object`&&l&&l.$$typeof===D&&Oa(l)===r.type){n(e,r.sibling),c=a(r,o.props),Fa(c,o),c.return=e,e=c;break a}n(e,r);break}else t(e,r);r=r.sibling}o.type===y?(c=mi(o.props.children,e.mode,c,o.key),c.return=e,e=c):(c=pi(o.type,o.key,o.props,null,e.mode,c),Fa(c,o),c.return=e,e=c)}return s(e);case v:a:{for(l=o.key;r!==null;){if(r.key===l)if(r.tag===4&&r.stateNode.containerInfo===o.containerInfo&&r.stateNode.implementation===o.implementation){n(e,r.sibling),c=a(r,o.children||[]),c.return=e,e=c;break a}else{n(e,r);break}else t(e,r);r=r.sibling}c=_i(o,e.mode,c),c.return=e,e=c}return s(e);case D:return o=Oa(o),b(e,r,o,c)}if(se(o))return h(e,r,o,c);if(ie(o)){if(l=ie(o),typeof l!=`function`)throw Error(i(150));return o=l.call(o),g(e,r,o,c)}if(typeof o.then==`function`)return b(e,r,Pa(o),c);if(o.$$typeof===C)return b(e,r,na(e,o),c);Ia(e,o)}return typeof o==`string`&&o!==``||typeof o==`number`||typeof o==`bigint`?(o=``+o,r!==null&&r.tag===6?(n(e,r.sibling),c=a(r,o),c.return=e,e=c):(n(e,r),c=hi(o,e.mode,c),c.return=e,e=c),s(e)):n(e,r)}return function(e,t,n,r){try{Na=0;var i=b(e,t,n,r);return Ma=null,i}catch(t){if(t===Sa||t===wa)throw t;var a=li(29,t,null,e.mode);return a.lanes=r,a.return=e,a}}}var Ra=La(!0),za=La(!1),Ba=!1;function Va(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Ha(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function Ua(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function Wa(e,t,n){var r=e.updateQueue;if(r===null)return null;if(r=r.shared,G&2){var i=r.pending;return i===null?t.next=t:(t.next=i.next,i.next=t),r.pending=t,t=oi(e),ai(e,null,n),t}return ni(e,r,t,n),oi(e)}function Ga(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,n&4194048)){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,it(e,n)}}function Ka(e,t){var n=e.updateQueue,r=e.alternate;if(r!==null&&(r=r.updateQueue,n===r)){var i=null,a=null;if(n=n.firstBaseUpdate,n!==null){do{var o={lane:n.lane,tag:n.tag,payload:n.payload,callback:null,next:null};a===null?i=a=o:a=a.next=o,n=n.next}while(n!==null);a===null?i=a=t:a=a.next=t}else i=a=t;n={baseState:r.baseState,firstBaseUpdate:i,lastBaseUpdate:a,shared:r.shared,callbacks:r.callbacks},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}var qa=!1;function Ja(){if(qa){var e=pa;if(e!==null)throw e}}function Ya(e,t,n,r){qa=!1;var i=e.updateQueue;Ba=!1;var a=i.firstBaseUpdate,o=i.lastBaseUpdate,s=i.shared.pending;if(s!==null){i.shared.pending=null;var c=s,l=c.next;c.next=null,o===null?a=l:o.next=l,o=c;var u=e.alternate;u!==null&&(u=u.updateQueue,s=u.lastBaseUpdate,s!==o&&(s===null?u.firstBaseUpdate=l:s.next=l,u.lastBaseUpdate=c))}if(a!==null){var d=i.baseState;o=0,u=l=c=null,s=a;do{var f=s.lane&-536870913,p=f!==s.lane;if(p?(J&f)===f:(r&f)===f){f!==0&&f===fa&&(qa=!0),u!==null&&(u=u.next={lane:0,tag:s.tag,payload:s.payload,callback:null,next:null});a:{var h=e,g=s;f=t;var _=n;switch(g.tag){case 1:if(h=g.payload,typeof h==`function`){d=h.call(_,d,f);break a}d=h;break a;case 3:h.flags=h.flags&-65537|128;case 0:if(h=g.payload,f=typeof h==`function`?h.call(_,d,f):h,f==null)break a;d=m({},d,f);break a;case 2:Ba=!0}}f=s.callback,f!==null&&(e.flags|=64,p&&(e.flags|=8192),p=i.callbacks,p===null?i.callbacks=[f]:p.push(f))}else p={lane:f,tag:s.tag,payload:s.payload,callback:s.callback,next:null},u===null?(l=u=p,c=d):u=u.next=p,o|=f;if(s=s.next,s===null){if(s=i.shared.pending,s===null)break;p=s,s=p.next,p.next=null,i.lastBaseUpdate=p,i.shared.pending=null}}while(1);u===null&&(c=d),i.baseState=c,i.firstBaseUpdate=l,i.lastBaseUpdate=u,a===null&&(i.shared.lanes=0),Gl|=o,e.lanes=o,e.memoizedState=d}}function Xa(e,t){if(typeof e!=`function`)throw Error(i(191,e));e.call(t)}function Za(e,t){var n=e.callbacks;if(n!==null)for(e.callbacks=null,e=0;e<n.length;e++)Xa(n[e],t)}var Qa=de(null),$a=de(0);function eo(e,t){e=Wl,j($a,e),j(Qa,t),Wl=e|t.baseLanes}function to(){j($a,Wl),j(Qa,Qa.current)}function no(){Wl=$a.current,A(Qa),A($a)}var ro=de(null),io=null;function ao(e){var t=e.alternate;j(uo,uo.current&1),j(ro,e),io===null&&(t===null||Qa.current!==null||t.memoizedState!==null)&&(io=e)}function oo(e){j(uo,uo.current),j(ro,e),io===null&&(io=e)}function so(e){e.tag===22?(j(uo,uo.current),j(ro,e),io===null&&(io=e)):co(e)}function co(){j(uo,uo.current),j(ro,ro.current)}function lo(e){A(ro),io===e&&(io=null),A(uo)}var uo=de(0);function fo(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||af(n)||of(n)))return t}else if(t.tag===19&&(t.memoizedProps.revealOrder===`forwards`||t.memoizedProps.revealOrder===`backwards`||t.memoizedProps.revealOrder===`unstable_legacy-backwards`||t.memoizedProps.revealOrder===`together`)){if(t.flags&128)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var po=0,B=null,V=null,mo=null,ho=!1,go=!1,_o=!1,vo=0,yo=0,bo=null,xo=0;function H(){throw Error(i(321))}function So(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!Cr(e[n],t[n]))return!1;return!0}function Co(e,t,n,r,i,a){return po=a,B=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,O.H=e===null||e.memoizedState===null?Bs:Vs,_o=!1,a=n(r,i),_o=!1,go&&(a=To(t,n,r,i)),wo(e),a}function wo(e){O.H=zs;var t=V!==null&&V.next!==null;if(po=0,mo=V=B=null,ho=!1,yo=0,bo=null,t)throw Error(i(300));e===null||ic||(e=e.dependencies,e!==null&&$i(e)&&(ic=!0))}function To(e,t,n,r){B=e;var a=0;do{if(go&&(bo=null),yo=0,go=!1,25<=a)throw Error(i(301));if(a+=1,mo=V=null,e.updateQueue!=null){var o=e.updateQueue;o.lastEffect=null,o.events=null,o.stores=null,o.memoCache!=null&&(o.memoCache.index=0)}O.H=Hs,o=t(n,r)}while(go);return o}function Eo(){var e=O.H,t=e.useState()[0];return t=typeof t.then==`function`?No(t):t,e=e.useState()[0],(V===null?null:V.memoizedState)!==e&&(B.flags|=1024),t}function Do(){var e=vo!==0;return vo=0,e}function Oo(e,t,n){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~n}function ko(e){if(ho){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}ho=!1}po=0,mo=V=B=null,go=!1,yo=vo=0,bo=null}function Ao(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return mo===null?B.memoizedState=mo=e:mo=mo.next=e,mo}function jo(){if(V===null){var e=B.alternate;e=e===null?null:e.memoizedState}else e=V.next;var t=mo===null?B.memoizedState:mo.next;if(t!==null)mo=t,V=e;else{if(e===null)throw B.alternate===null?Error(i(467)):Error(i(310));V=e,e={memoizedState:V.memoizedState,baseState:V.baseState,baseQueue:V.baseQueue,queue:V.queue,next:null},mo===null?B.memoizedState=mo=e:mo=mo.next=e}return mo}function Mo(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function No(e){var t=yo;return yo+=1,bo===null&&(bo=[]),e=Da(bo,e,t),t=B,(mo===null?t.memoizedState:mo.next)===null&&(t=t.alternate,O.H=t===null||t.memoizedState===null?Bs:Vs),e}function Po(e){if(typeof e==`object`&&e){if(typeof e.then==`function`)return No(e);if(e.$$typeof===C)return ta(e)}throw Error(i(438,String(e)))}function Fo(e){var t=null,n=B.updateQueue;if(n!==null&&(t=n.memoCache),t==null){var r=B.alternate;r!==null&&(r=r.updateQueue,r!==null&&(r=r.memoCache,r!=null&&(t={data:r.data.map(function(e){return e.slice()}),index:0})))}if(t??={data:[],index:0},n===null&&(n=Mo(),B.updateQueue=n),n.memoCache=t,n=t.data[t.index],n===void 0)for(n=t.data[t.index]=Array(e),r=0;r<e;r++)n[r]=ne;return t.index++,n}function Io(e,t){return typeof t==`function`?t(e):t}function Lo(e){return Ro(jo(),V,e)}function Ro(e,t,n){var r=e.queue;if(r===null)throw Error(i(311));r.lastRenderedReducer=n;var a=e.baseQueue,o=r.pending;if(o!==null){if(a!==null){var s=a.next;a.next=o.next,o.next=s}t.baseQueue=a=o,r.pending=null}if(o=e.baseState,a===null)e.memoizedState=o;else{t=a.next;var c=s=null,l=null,u=t,d=!1;do{var f=u.lane&-536870913;if(f===u.lane?(po&f)===f:(J&f)===f){var p=u.revertLane;if(p===0)l!==null&&(l=l.next={lane:0,revertLane:0,gesture:null,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null}),f===fa&&(d=!0);else if((po&p)===p){u=u.next,p===fa&&(d=!0);continue}else f={lane:0,revertLane:u.revertLane,gesture:null,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null},l===null?(c=l=f,s=o):l=l.next=f,B.lanes|=p,Gl|=p;f=u.action,_o&&n(o,f),o=u.hasEagerState?u.eagerState:n(o,f)}else p={lane:f,revertLane:u.revertLane,gesture:u.gesture,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null},l===null?(c=l=p,s=o):l=l.next=p,B.lanes|=f,Gl|=f;u=u.next}while(u!==null&&u!==t);if(l===null?s=o:l.next=c,!Cr(o,e.memoizedState)&&(ic=!0,d&&(n=pa,n!==null)))throw n;e.memoizedState=o,e.baseState=s,e.baseQueue=l,r.lastRenderedState=o}return a===null&&(r.lanes=0),[e.memoizedState,r.dispatch]}function zo(e){var t=jo(),n=t.queue;if(n===null)throw Error(i(311));n.lastRenderedReducer=e;var r=n.dispatch,a=n.pending,o=t.memoizedState;if(a!==null){n.pending=null;var s=a=a.next;do o=e(o,s.action),s=s.next;while(s!==a);Cr(o,t.memoizedState)||(ic=!0),t.memoizedState=o,t.baseQueue===null&&(t.baseState=o),n.lastRenderedState=o}return[o,r]}function Bo(e,t,n){var r=B,a=jo(),o=z;if(o){if(n===void 0)throw Error(i(407));n=n()}else n=t();var s=!Cr((V||a).memoizedState,n);if(s&&(a.memoizedState=n,ic=!0),a=a.queue,ds(Uo.bind(null,r,a,e),[e]),a.getSnapshot!==t||s||mo!==null&&mo.memoizedState.tag&1){if(r.flags|=2048,os(9,{destroy:void 0},Ho.bind(null,r,a,n,t),null),K===null)throw Error(i(349));o||po&127||Vo(r,t,n)}return n}function Vo(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=B.updateQueue,t===null?(t=Mo(),B.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function Ho(e,t,n,r){t.value=n,t.getSnapshot=r,Wo(t)&&Go(e)}function Uo(e,t,n){return n(function(){Wo(t)&&Go(e)})}function Wo(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!Cr(e,n)}catch{return!0}}function Go(e){var t=ii(e,2);t!==null&&hu(t,e,2)}function Ko(e){var t=Ao();if(typeof e==`function`){var n=e;if(e=n(),_o){Ve(!0);try{n()}finally{Ve(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Io,lastRenderedState:e},t}function qo(e,t,n,r){return e.baseState=n,Ro(e,V,typeof r==`function`?r:Io)}function Jo(e,t,n,r,a){if(Is(e))throw Error(i(485));if(e=t.action,e!==null){var o={payload:a,action:e,next:null,isTransition:!0,status:`pending`,value:null,reason:null,listeners:[],then:function(e){o.listeners.push(e)}};O.T===null?o.isTransition=!1:n(!0),r(o),n=t.pending,n===null?(o.next=t.pending=o,Yo(t,o)):(o.next=n.next,t.pending=n.next=o)}}function Yo(e,t){var n=t.action,r=t.payload,i=e.state;if(t.isTransition){var a=O.T,o={};O.T=o;try{var s=n(i,r),c=O.S;c!==null&&c(o,s),Xo(e,t,s)}catch(n){Qo(e,t,n)}finally{a!==null&&o.types!==null&&(a.types=o.types),O.T=a}}else try{a=n(i,r),Xo(e,t,a)}catch(n){Qo(e,t,n)}}function Xo(e,t,n){typeof n==`object`&&n&&typeof n.then==`function`?n.then(function(n){Zo(e,t,n)},function(n){return Qo(e,t,n)}):Zo(e,t,n)}function Zo(e,t,n){t.status=`fulfilled`,t.value=n,$o(t),e.state=n,t=e.pending,t!==null&&(n=t.next,n===t?e.pending=null:(n=n.next,t.next=n,Yo(e,n)))}function Qo(e,t,n){var r=e.pending;if(e.pending=null,r!==null){r=r.next;do t.status=`rejected`,t.reason=n,$o(t),t=t.next;while(t!==r)}e.action=null}function $o(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function es(e,t){return t}function ts(e,t){if(z){var n=K.formState;if(n!==null){a:{var r=B;if(z){if(R){b:{for(var i=R,a=Ii;i.nodeType!==8;){if(!a){i=null;break b}if(i=cf(i.nextSibling),i===null){i=null;break b}}a=i.data,i=a===`F!`||a===`F`?i:null}if(i){R=cf(i.nextSibling),r=i.data===`F!`;break a}}Ri(r)}r=!1}r&&(t=n[0])}}return n=Ao(),n.memoizedState=n.baseState=t,r={pending:null,lanes:0,dispatch:null,lastRenderedReducer:es,lastRenderedState:t},n.queue=r,n=Ns.bind(null,B,r),r.dispatch=n,r=Ko(!1),a=Fs.bind(null,B,!1,r.queue),r=Ao(),i={state:t,dispatch:null,action:e,pending:null},r.queue=i,n=Jo.bind(null,B,i,a,n),i.dispatch=n,r.memoizedState=e,[t,n,!1]}function ns(e){return rs(jo(),V,e)}function rs(e,t,n){if(t=Ro(e,t,es)[0],e=Lo(Io)[0],typeof t==`object`&&t&&typeof t.then==`function`)try{var r=No(t)}catch(e){throw e===Sa?wa:e}else r=t;t=jo();var i=t.queue,a=i.dispatch;return n!==t.memoizedState&&(B.flags|=2048,os(9,{destroy:void 0},is.bind(null,i,n),null)),[r,a,e]}function is(e,t){e.action=t}function as(e){var t=jo(),n=V;if(n!==null)return rs(t,n,e);jo(),t=t.memoizedState,n=jo();var r=n.queue.dispatch;return n.memoizedState=e,[t,r,!1]}function os(e,t,n,r){return e={tag:e,create:n,deps:r,inst:t,next:null},t=B.updateQueue,t===null&&(t=Mo(),B.updateQueue=t),n=t.lastEffect,n===null?t.lastEffect=e.next=e:(r=n.next,n.next=e,e.next=r,t.lastEffect=e),e}function ss(){return jo().memoizedState}function cs(e,t,n,r){var i=Ao();B.flags|=e,i.memoizedState=os(1|t,{destroy:void 0},n,r===void 0?null:r)}function ls(e,t,n,r){var i=jo();r=r===void 0?null:r;var a=i.memoizedState.inst;V!==null&&r!==null&&So(r,V.memoizedState.deps)?i.memoizedState=os(t,a,n,r):(B.flags|=e,i.memoizedState=os(1|t,a,n,r))}function us(e,t){cs(8390656,8,e,t)}function ds(e,t){ls(2048,8,e,t)}function fs(e){B.flags|=4;var t=B.updateQueue;if(t===null)t=Mo(),B.updateQueue=t,t.events=[e];else{var n=t.events;n===null?t.events=[e]:n.push(e)}}function ps(e){var t=jo().memoizedState;return fs({ref:t,nextImpl:e}),function(){if(G&2)throw Error(i(440));return t.impl.apply(void 0,arguments)}}function ms(e,t){return ls(4,2,e,t)}function hs(e,t){return ls(4,4,e,t)}function gs(e,t){if(typeof t==`function`){e=e();var n=t(e);return function(){typeof n==`function`?n():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function _s(e,t,n){n=n==null?null:n.concat([e]),ls(4,4,gs.bind(null,t,e),n)}function vs(){}function ys(e,t){var n=jo();t=t===void 0?null:t;var r=n.memoizedState;return t!==null&&So(t,r[1])?r[0]:(n.memoizedState=[e,t],e)}function bs(e,t){var n=jo();t=t===void 0?null:t;var r=n.memoizedState;if(t!==null&&So(t,r[1]))return r[0];if(r=e(),_o){Ve(!0);try{e()}finally{Ve(!1)}}return n.memoizedState=[r,t],r}function xs(e,t,n){return n===void 0||po&1073741824&&!(J&261930)?e.memoizedState=t:(e.memoizedState=n,e=mu(),B.lanes|=e,Gl|=e,n)}function Ss(e,t,n,r){return Cr(n,t)?n:Qa.current===null?!(po&42)||po&1073741824&&!(J&261930)?(ic=!0,e.memoizedState=n):(e=mu(),B.lanes|=e,Gl|=e,t):(e=xs(e,n,r),Cr(e,t)||(ic=!0),e)}function Cs(e,t,n,r,i){var a=k.p;k.p=a!==0&&8>a?a:8;var o=O.T,s={};O.T=s,Fs(e,!1,t,n);try{var c=i(),l=O.S;l!==null&&l(s,c),typeof c==`object`&&c&&typeof c.then==`function`?Ps(e,t,ga(c,r),pu(e)):Ps(e,t,r,pu(e))}catch(n){Ps(e,t,{then:function(){},status:`rejected`,reason:n},pu())}finally{k.p=a,o!==null&&s.types!==null&&(o.types=s.types),O.T=o}}function ws(){}function Ts(e,t,n,r){if(e.tag!==5)throw Error(i(476));var a=Es(e).queue;Cs(e,a,t,ce,n===null?ws:function(){return Ds(e),n(r)})}function Es(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:ce,baseState:ce,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Io,lastRenderedState:ce},next:null};var n={};return t.next={memoizedState:n,baseState:n,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Io,lastRenderedState:n},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function Ds(e){var t=Es(e);t.next===null&&(t=e.alternate.memoizedState),Ps(e,t.next.queue,{},pu())}function Os(){return ta(Qf)}function ks(){return jo().memoizedState}function As(){return jo().memoizedState}function js(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var n=pu();e=Ua(n);var r=Wa(t,e,n);r!==null&&(hu(r,t,n),Ga(r,t,n)),t={cache:ca()},e.payload=t;return}t=t.return}}function Ms(e,t,n){var r=pu();n={lane:r,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null},Is(e)?Ls(t,n):(n=ri(e,t,n,r),n!==null&&(hu(n,e,r),Rs(n,t,r)))}function Ns(e,t,n){Ps(e,t,n,pu())}function Ps(e,t,n,r){var i={lane:r,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null};if(Is(e))Ls(t,i);else{var a=e.alternate;if(e.lanes===0&&(a===null||a.lanes===0)&&(a=t.lastRenderedReducer,a!==null))try{var o=t.lastRenderedState,s=a(o,n);if(i.hasEagerState=!0,i.eagerState=s,Cr(s,o))return ni(e,t,i,0),K===null&&ti(),!1}catch{}if(n=ri(e,t,i,r),n!==null)return hu(n,e,r),Rs(n,t,r),!0}return!1}function Fs(e,t,n,r){if(r={lane:2,revertLane:dd(),gesture:null,action:r,hasEagerState:!1,eagerState:null,next:null},Is(e)){if(t)throw Error(i(479))}else t=ri(e,n,r,2),t!==null&&hu(t,e,2)}function Is(e){var t=e.alternate;return e===B||t!==null&&t===B}function Ls(e,t){go=ho=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function Rs(e,t,n){if(n&4194048){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,it(e,n)}}var zs={readContext:ta,use:Po,useCallback:H,useContext:H,useEffect:H,useImperativeHandle:H,useLayoutEffect:H,useInsertionEffect:H,useMemo:H,useReducer:H,useRef:H,useState:H,useDebugValue:H,useDeferredValue:H,useTransition:H,useSyncExternalStore:H,useId:H,useHostTransitionStatus:H,useFormState:H,useActionState:H,useOptimistic:H,useMemoCache:H,useCacheRefresh:H};zs.useEffectEvent=H;var Bs={readContext:ta,use:Po,useCallback:function(e,t){return Ao().memoizedState=[e,t===void 0?null:t],e},useContext:ta,useEffect:us,useImperativeHandle:function(e,t,n){n=n==null?null:n.concat([e]),cs(4194308,4,gs.bind(null,t,e),n)},useLayoutEffect:function(e,t){return cs(4194308,4,e,t)},useInsertionEffect:function(e,t){cs(4,2,e,t)},useMemo:function(e,t){var n=Ao();t=t===void 0?null:t;var r=e();if(_o){Ve(!0);try{e()}finally{Ve(!1)}}return n.memoizedState=[r,t],r},useReducer:function(e,t,n){var r=Ao();if(n!==void 0){var i=n(t);if(_o){Ve(!0);try{n(t)}finally{Ve(!1)}}}else i=t;return r.memoizedState=r.baseState=i,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:i},r.queue=e,e=e.dispatch=Ms.bind(null,B,e),[r.memoizedState,e]},useRef:function(e){var t=Ao();return e={current:e},t.memoizedState=e},useState:function(e){e=Ko(e);var t=e.queue,n=Ns.bind(null,B,t);return t.dispatch=n,[e.memoizedState,n]},useDebugValue:vs,useDeferredValue:function(e,t){return xs(Ao(),e,t)},useTransition:function(){var e=Ko(!1);return e=Cs.bind(null,B,e.queue,!0,!1),Ao().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,n){var r=B,a=Ao();if(z){if(n===void 0)throw Error(i(407));n=n()}else{if(n=t(),K===null)throw Error(i(349));J&127||Vo(r,t,n)}a.memoizedState=n;var o={value:n,getSnapshot:t};return a.queue=o,us(Uo.bind(null,r,o,e),[e]),r.flags|=2048,os(9,{destroy:void 0},Ho.bind(null,r,o,n,t),null),n},useId:function(){var e=Ao(),t=K.identifierPrefix;if(z){var n=Oi,r=Di;n=(r&~(1<<32-He(r)-1)).toString(32)+n,t=`_`+t+`R_`+n,n=vo++,0<n&&(t+=`H`+n.toString(32)),t+=`_`}else n=xo++,t=`_`+t+`r_`+n.toString(32)+`_`;return e.memoizedState=t},useHostTransitionStatus:Os,useFormState:ts,useActionState:ts,useOptimistic:function(e){var t=Ao();t.memoizedState=t.baseState=e;var n={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=n,t=Fs.bind(null,B,!0,n),n.dispatch=t,[e,t]},useMemoCache:Fo,useCacheRefresh:function(){return Ao().memoizedState=js.bind(null,B)},useEffectEvent:function(e){var t=Ao(),n={impl:e};return t.memoizedState=n,function(){if(G&2)throw Error(i(440));return n.impl.apply(void 0,arguments)}}},Vs={readContext:ta,use:Po,useCallback:ys,useContext:ta,useEffect:ds,useImperativeHandle:_s,useInsertionEffect:ms,useLayoutEffect:hs,useMemo:bs,useReducer:Lo,useRef:ss,useState:function(){return Lo(Io)},useDebugValue:vs,useDeferredValue:function(e,t){return Ss(jo(),V.memoizedState,e,t)},useTransition:function(){var e=Lo(Io)[0],t=jo().memoizedState;return[typeof e==`boolean`?e:No(e),t]},useSyncExternalStore:Bo,useId:ks,useHostTransitionStatus:Os,useFormState:ns,useActionState:ns,useOptimistic:function(e,t){return qo(jo(),V,e,t)},useMemoCache:Fo,useCacheRefresh:As};Vs.useEffectEvent=ps;var Hs={readContext:ta,use:Po,useCallback:ys,useContext:ta,useEffect:ds,useImperativeHandle:_s,useInsertionEffect:ms,useLayoutEffect:hs,useMemo:bs,useReducer:zo,useRef:ss,useState:function(){return zo(Io)},useDebugValue:vs,useDeferredValue:function(e,t){var n=jo();return V===null?xs(n,e,t):Ss(n,V.memoizedState,e,t)},useTransition:function(){var e=zo(Io)[0],t=jo().memoizedState;return[typeof e==`boolean`?e:No(e),t]},useSyncExternalStore:Bo,useId:ks,useHostTransitionStatus:Os,useFormState:as,useActionState:as,useOptimistic:function(e,t){var n=jo();return V===null?(n.baseState=e,[e,n.queue.dispatch]):qo(n,V,e,t)},useMemoCache:Fo,useCacheRefresh:As};Hs.useEffectEvent=ps;function Us(e,t,n,r){t=e.memoizedState,n=n(r,t),n=n==null?t:m({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var Ws={enqueueSetState:function(e,t,n){e=e._reactInternals;var r=pu(),i=Ua(r);i.payload=t,n!=null&&(i.callback=n),t=Wa(e,i,r),t!==null&&(hu(t,e,r),Ga(t,e,r))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var r=pu(),i=Ua(r);i.tag=1,i.payload=t,n!=null&&(i.callback=n),t=Wa(e,i,r),t!==null&&(hu(t,e,r),Ga(t,e,r))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=pu(),r=Ua(n);r.tag=2,t!=null&&(r.callback=t),t=Wa(e,r,n),t!==null&&(hu(t,e,n),Ga(t,e,n))}};function Gs(e,t,n,r,i,a,o){return e=e.stateNode,typeof e.shouldComponentUpdate==`function`?e.shouldComponentUpdate(r,a,o):t.prototype&&t.prototype.isPureReactComponent?!wr(n,r)||!wr(i,a):!0}function Ks(e,t,n,r){e=t.state,typeof t.componentWillReceiveProps==`function`&&t.componentWillReceiveProps(n,r),typeof t.UNSAFE_componentWillReceiveProps==`function`&&t.UNSAFE_componentWillReceiveProps(n,r),t.state!==e&&Ws.enqueueReplaceState(t,t.state,null)}function qs(e,t){var n=t;if(`ref`in t)for(var r in n={},t)r!==`ref`&&(n[r]=t[r]);if(e=e.defaultProps)for(var i in n===t&&(n=m({},n)),e)n[i]===void 0&&(n[i]=e[i]);return n}function Js(e){Zr(e)}function Ys(e){console.error(e)}function Xs(e){Zr(e)}function Zs(e,t){try{var n=e.onUncaughtError;n(t.value,{componentStack:t.stack})}catch(e){setTimeout(function(){throw e})}}function Qs(e,t,n){try{var r=e.onCaughtError;r(n.value,{componentStack:n.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(e){setTimeout(function(){throw e})}}function $s(e,t,n){return n=Ua(n),n.tag=3,n.payload={element:null},n.callback=function(){Zs(e,t)},n}function ec(e){return e=Ua(e),e.tag=3,e}function tc(e,t,n,r){var i=n.type.getDerivedStateFromError;if(typeof i==`function`){var a=r.value;e.payload=function(){return i(a)},e.callback=function(){Qs(t,n,r)}}var o=n.stateNode;o!==null&&typeof o.componentDidCatch==`function`&&(e.callback=function(){Qs(t,n,r),typeof i!=`function`&&(ru===null?ru=new Set([this]):ru.add(this));var e=r.stack;this.componentDidCatch(r.value,{componentStack:e===null?``:e})})}function nc(e,t,n,r,a){if(n.flags|=32768,typeof r==`object`&&r&&typeof r.then==`function`){if(t=n.alternate,t!==null&&Qi(t,n,a,!0),n=ro.current,n!==null){switch(n.tag){case 31:case 13:return io===null?Du():n.alternate===null&&X===0&&(X=3),n.flags&=-257,n.flags|=65536,n.lanes=a,r===Ta?n.flags|=16384:(t=n.updateQueue,t===null?n.updateQueue=new Set([r]):t.add(r),Gu(e,r,a)),!1;case 22:return n.flags|=65536,r===Ta?n.flags|=16384:(t=n.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([r])},n.updateQueue=t):(n=t.retryQueue,n===null?t.retryQueue=new Set([r]):n.add(r)),Gu(e,r,a)),!1}throw Error(i(435,n.tag))}return Gu(e,r,a),Du(),!1}if(z)return t=ro.current,t===null?(r!==Li&&(t=Error(i(423),{cause:r}),Wi(yi(t,n))),e=e.current.alternate,e.flags|=65536,a&=-a,e.lanes|=a,r=yi(r,n),a=$s(e.stateNode,r,a),Ka(e,a),X!==4&&(X=2)):(!(t.flags&65536)&&(t.flags|=256),t.flags|=65536,t.lanes=a,r!==Li&&(e=Error(i(422),{cause:r}),Wi(yi(e,n)))),!1;var o=Error(i(520),{cause:r});if(o=yi(o,n),Xl===null?Xl=[o]:Xl.push(o),X!==4&&(X=2),t===null)return!0;r=yi(r,n),n=t;do{switch(n.tag){case 3:return n.flags|=65536,e=a&-a,n.lanes|=e,e=$s(n.stateNode,r,e),Ka(n,e),!1;case 1:if(t=n.type,o=n.stateNode,!(n.flags&128)&&(typeof t.getDerivedStateFromError==`function`||o!==null&&typeof o.componentDidCatch==`function`&&(ru===null||!ru.has(o))))return n.flags|=65536,a&=-a,n.lanes|=a,a=ec(a),tc(a,e,n,r),Ka(n,a),!1}n=n.return}while(n!==null);return!1}var rc=Error(i(461)),ic=!1;function ac(e,t,n,r){t.child=e===null?za(t,null,n,r):Ra(t,e.child,n,r)}function oc(e,t,n,r,i){n=n.render;var a=t.ref;if(`ref`in r){var o={};for(var s in r)s!==`ref`&&(o[s]=r[s])}else o=r;return ea(t),r=Co(e,t,n,o,a,i),s=Do(),e!==null&&!ic?(Oo(e,t,i),Ac(e,t,i)):(z&&s&&ji(t),t.flags|=1,ac(e,t,r,i),t.child)}function sc(e,t,n,r,i){if(e===null){var a=n.type;return typeof a==`function`&&!ui(a)&&a.defaultProps===void 0&&n.compare===null?(t.tag=15,t.type=a,cc(e,t,a,r,i)):(e=pi(n.type,null,r,t,t.mode,i),e.ref=t.ref,e.return=t,t.child=e)}if(a=e.child,!jc(e,i)){var o=a.memoizedProps;if(n=n.compare,n=n===null?wr:n,n(o,r)&&e.ref===t.ref)return Ac(e,t,i)}return t.flags|=1,e=di(a,r),e.ref=t.ref,e.return=t,t.child=e}function cc(e,t,n,r,i){if(e!==null){var a=e.memoizedProps;if(wr(a,r)&&e.ref===t.ref)if(ic=!1,t.pendingProps=r=a,jc(e,i))e.flags&131072&&(ic=!0);else return t.lanes=e.lanes,Ac(e,t,i)}return gc(e,t,n,r,i)}function lc(e,t,n,r){var i=r.children,a=e===null?null:e.memoizedState;if(e===null&&t.stateNode===null&&(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),r.mode===`hidden`){if(t.flags&128){if(a=a===null?n:a.baseLanes|n,e!==null){for(r=t.child=e.child,i=0;r!==null;)i=i|r.lanes|r.childLanes,r=r.sibling;r=i&~a}else r=0,t.child=null;return dc(e,t,a,n,r)}if(n&536870912)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&ba(t,a===null?null:a.cachePool),a===null?to():eo(t,a),so(t);else return r=t.lanes=536870912,dc(e,t,a===null?n:a.baseLanes|n,n,r)}else a===null?(e!==null&&ba(t,null),to(),co(t)):(ba(t,a.cachePool),eo(t,a),co(t),t.memoizedState=null);return ac(e,t,i,n),t.child}function uc(e,t){return e!==null&&e.tag===22||t.stateNode!==null||(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),t.sibling}function dc(e,t,n,r,i){var a=ya();return a=a===null?null:{parent:sa._currentValue,pool:a},t.memoizedState={baseLanes:n,cachePool:a},e!==null&&ba(t,null),to(),so(t),e!==null&&Qi(e,t,r,!0),t.childLanes=i,null}function fc(e,t){return t=Tc({mode:t.mode,children:t.children},e.mode),t.ref=e.ref,e.child=t,t.return=e,t}function pc(e,t,n){return Ra(t,e.child,null,n),e=fc(t,t.pendingProps),e.flags|=2,lo(t),t.memoizedState=null,e}function mc(e,t,n){var r=t.pendingProps,a=(t.flags&128)!=0;if(t.flags&=-129,e===null){if(z){if(r.mode===`hidden`)return e=fc(t,r),t.lanes=536870912,uc(null,e);if(oo(t),(e=R)?(e=rf(e,Ii),e=e!==null&&e.data===`&`?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:Ei===null?null:{id:Di,overflow:Oi},retryLane:536870912,hydrationErrors:null},n=gi(e),n.return=t,t.child=n,Pi=t,R=null)):e=null,e===null)throw Ri(t);return t.lanes=536870912,null}return fc(t,r)}var o=e.memoizedState;if(o!==null){var s=o.dehydrated;if(oo(t),a)if(t.flags&256)t.flags&=-257,t=pc(e,t,n);else if(t.memoizedState!==null)t.child=e.child,t.flags|=128,t=null;else throw Error(i(558));else if(ic||Qi(e,t,n,!1),a=(n&e.childLanes)!==0,ic||a){if(r=K,r!==null&&(s=at(r,n),s!==0&&s!==o.retryLane))throw o.retryLane=s,ii(e,s),hu(r,e,s),rc;Du(),t=pc(e,t,n)}else e=o.treeContext,R=cf(s.nextSibling),Pi=t,z=!0,Fi=null,Ii=!1,e!==null&&Ni(t,e),t=fc(t,r),t.flags|=4096;return t}return e=di(e.child,{mode:r.mode,children:r.children}),e.ref=t.ref,t.child=e,e.return=t,e}function hc(e,t){var n=t.ref;if(n===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof n!=`function`&&typeof n!=`object`)throw Error(i(284));(e===null||e.ref!==n)&&(t.flags|=4194816)}}function gc(e,t,n,r,i){return ea(t),n=Co(e,t,n,r,void 0,i),r=Do(),e!==null&&!ic?(Oo(e,t,i),Ac(e,t,i)):(z&&r&&ji(t),t.flags|=1,ac(e,t,n,i),t.child)}function _c(e,t,n,r,i,a){return ea(t),t.updateQueue=null,n=To(t,r,n,i),wo(e),r=Do(),e!==null&&!ic?(Oo(e,t,a),Ac(e,t,a)):(z&&r&&ji(t),t.flags|=1,ac(e,t,n,a),t.child)}function vc(e,t,n,r,i){if(ea(t),t.stateNode===null){var a=si,o=n.contextType;typeof o==`object`&&o&&(a=ta(o)),a=new n(r,a),t.memoizedState=a.state!==null&&a.state!==void 0?a.state:null,a.updater=Ws,t.stateNode=a,a._reactInternals=t,a=t.stateNode,a.props=r,a.state=t.memoizedState,a.refs={},Va(t),o=n.contextType,a.context=typeof o==`object`&&o?ta(o):si,a.state=t.memoizedState,o=n.getDerivedStateFromProps,typeof o==`function`&&(Us(t,n,o,r),a.state=t.memoizedState),typeof n.getDerivedStateFromProps==`function`||typeof a.getSnapshotBeforeUpdate==`function`||typeof a.UNSAFE_componentWillMount!=`function`&&typeof a.componentWillMount!=`function`||(o=a.state,typeof a.componentWillMount==`function`&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount==`function`&&a.UNSAFE_componentWillMount(),o!==a.state&&Ws.enqueueReplaceState(a,a.state,null),Ya(t,r,a,i),Ja(),a.state=t.memoizedState),typeof a.componentDidMount==`function`&&(t.flags|=4194308),r=!0}else if(e===null){a=t.stateNode;var s=t.memoizedProps,c=qs(n,s);a.props=c;var l=a.context,u=n.contextType;o=si,typeof u==`object`&&u&&(o=ta(u));var d=n.getDerivedStateFromProps;u=typeof d==`function`||typeof a.getSnapshotBeforeUpdate==`function`,s=t.pendingProps!==s,u||typeof a.UNSAFE_componentWillReceiveProps!=`function`&&typeof a.componentWillReceiveProps!=`function`||(s||l!==o)&&Ks(t,a,r,o),Ba=!1;var f=t.memoizedState;a.state=f,Ya(t,r,a,i),Ja(),l=t.memoizedState,s||f!==l||Ba?(typeof d==`function`&&(Us(t,n,d,r),l=t.memoizedState),(c=Ba||Gs(t,n,c,r,f,l,o))?(u||typeof a.UNSAFE_componentWillMount!=`function`&&typeof a.componentWillMount!=`function`||(typeof a.componentWillMount==`function`&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount==`function`&&a.UNSAFE_componentWillMount()),typeof a.componentDidMount==`function`&&(t.flags|=4194308)):(typeof a.componentDidMount==`function`&&(t.flags|=4194308),t.memoizedProps=r,t.memoizedState=l),a.props=r,a.state=l,a.context=o,r=c):(typeof a.componentDidMount==`function`&&(t.flags|=4194308),r=!1)}else{a=t.stateNode,Ha(e,t),o=t.memoizedProps,u=qs(n,o),a.props=u,d=t.pendingProps,f=a.context,l=n.contextType,c=si,typeof l==`object`&&l&&(c=ta(l)),s=n.getDerivedStateFromProps,(l=typeof s==`function`||typeof a.getSnapshotBeforeUpdate==`function`)||typeof a.UNSAFE_componentWillReceiveProps!=`function`&&typeof a.componentWillReceiveProps!=`function`||(o!==d||f!==c)&&Ks(t,a,r,c),Ba=!1,f=t.memoizedState,a.state=f,Ya(t,r,a,i),Ja();var p=t.memoizedState;o!==d||f!==p||Ba||e!==null&&e.dependencies!==null&&$i(e.dependencies)?(typeof s==`function`&&(Us(t,n,s,r),p=t.memoizedState),(u=Ba||Gs(t,n,u,r,f,p,c)||e!==null&&e.dependencies!==null&&$i(e.dependencies))?(l||typeof a.UNSAFE_componentWillUpdate!=`function`&&typeof a.componentWillUpdate!=`function`||(typeof a.componentWillUpdate==`function`&&a.componentWillUpdate(r,p,c),typeof a.UNSAFE_componentWillUpdate==`function`&&a.UNSAFE_componentWillUpdate(r,p,c)),typeof a.componentDidUpdate==`function`&&(t.flags|=4),typeof a.getSnapshotBeforeUpdate==`function`&&(t.flags|=1024)):(typeof a.componentDidUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),t.memoizedProps=r,t.memoizedState=p),a.props=r,a.state=p,a.context=c,r=u):(typeof a.componentDidUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),r=!1)}return a=r,hc(e,t),r=(t.flags&128)!=0,a||r?(a=t.stateNode,n=r&&typeof n.getDerivedStateFromError!=`function`?null:a.render(),t.flags|=1,e!==null&&r?(t.child=Ra(t,e.child,null,i),t.child=Ra(t,null,n,i)):ac(e,t,n,i),t.memoizedState=a.state,e=t.child):e=Ac(e,t,i),e}function yc(e,t,n,r){return Hi(),t.flags|=256,ac(e,t,n,r),t.child}var bc={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function xc(e){return{baseLanes:e,cachePool:xa()}}function Sc(e,t,n){return e=e===null?0:e.childLanes&~n,t&&(e|=Jl),e}function Cc(e,t,n){var r=t.pendingProps,a=!1,o=(t.flags&128)!=0,s;if((s=o)||(s=e!==null&&e.memoizedState===null?!1:(uo.current&2)!=0),s&&(a=!0,t.flags&=-129),s=(t.flags&32)!=0,t.flags&=-33,e===null){if(z){if(a?ao(t):co(t),(e=R)?(e=rf(e,Ii),e=e!==null&&e.data!==`&`?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:Ei===null?null:{id:Di,overflow:Oi},retryLane:536870912,hydrationErrors:null},n=gi(e),n.return=t,t.child=n,Pi=t,R=null)):e=null,e===null)throw Ri(t);return of(e)?t.lanes=32:t.lanes=536870912,null}var c=r.children;return r=r.fallback,a?(co(t),a=t.mode,c=Tc({mode:`hidden`,children:c},a),r=mi(r,a,n,null),c.return=t,r.return=t,c.sibling=r,t.child=c,r=t.child,r.memoizedState=xc(n),r.childLanes=Sc(e,s,n),t.memoizedState=bc,uc(null,r)):(ao(t),wc(t,c))}var l=e.memoizedState;if(l!==null&&(c=l.dehydrated,c!==null)){if(o)t.flags&256?(ao(t),t.flags&=-257,t=Ec(e,t,n)):t.memoizedState===null?(co(t),c=r.fallback,a=t.mode,r=Tc({mode:`visible`,children:r.children},a),c=mi(c,a,n,null),c.flags|=2,r.return=t,c.return=t,r.sibling=c,t.child=r,Ra(t,e.child,null,n),r=t.child,r.memoizedState=xc(n),r.childLanes=Sc(e,s,n),t.memoizedState=bc,t=uc(null,r)):(co(t),t.child=e.child,t.flags|=128,t=null);else if(ao(t),of(c)){if(s=c.nextSibling&&c.nextSibling.dataset,s)var u=s.dgst;s=u,r=Error(i(419)),r.stack=``,r.digest=s,Wi({value:r,source:null,stack:null}),t=Ec(e,t,n)}else if(ic||Qi(e,t,n,!1),s=(n&e.childLanes)!==0,ic||s){if(s=K,s!==null&&(r=at(s,n),r!==0&&r!==l.retryLane))throw l.retryLane=r,ii(e,r),hu(s,e,r),rc;af(c)||Du(),t=Ec(e,t,n)}else af(c)?(t.flags|=192,t.child=e.child,t=null):(e=l.treeContext,R=cf(c.nextSibling),Pi=t,z=!0,Fi=null,Ii=!1,e!==null&&Ni(t,e),t=wc(t,r.children),t.flags|=4096);return t}return a?(co(t),c=r.fallback,a=t.mode,l=e.child,u=l.sibling,r=di(l,{mode:`hidden`,children:r.children}),r.subtreeFlags=l.subtreeFlags&65011712,u===null?(c=mi(c,a,n,null),c.flags|=2):c=di(u,c),c.return=t,r.return=t,r.sibling=c,t.child=r,uc(null,r),r=t.child,c=e.child.memoizedState,c===null?c=xc(n):(a=c.cachePool,a===null?a=xa():(l=sa._currentValue,a=a.parent===l?a:{parent:l,pool:l}),c={baseLanes:c.baseLanes|n,cachePool:a}),r.memoizedState=c,r.childLanes=Sc(e,s,n),t.memoizedState=bc,uc(e.child,r)):(ao(t),n=e.child,e=n.sibling,n=di(n,{mode:`visible`,children:r.children}),n.return=t,n.sibling=null,e!==null&&(s=t.deletions,s===null?(t.deletions=[e],t.flags|=16):s.push(e)),t.child=n,t.memoizedState=null,n)}function wc(e,t){return t=Tc({mode:`visible`,children:t},e.mode),t.return=e,e.child=t}function Tc(e,t){return e=li(22,e,null,t),e.lanes=0,e}function Ec(e,t,n){return Ra(t,e.child,null,n),e=wc(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function Dc(e,t,n){e.lanes|=t;var r=e.alternate;r!==null&&(r.lanes|=t),Xi(e.return,t,n)}function Oc(e,t,n,r,i,a){var o=e.memoizedState;o===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:r,tail:n,tailMode:i,treeForkCount:a}:(o.isBackwards=t,o.rendering=null,o.renderingStartTime=0,o.last=r,o.tail=n,o.tailMode=i,o.treeForkCount=a)}function kc(e,t,n){var r=t.pendingProps,i=r.revealOrder,a=r.tail;r=r.children;var o=uo.current,s=(o&2)!=0;if(s?(o=o&1|2,t.flags|=128):o&=1,j(uo,o),ac(e,t,r,n),r=z?Ci:0,!s&&e!==null&&e.flags&128)a:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Dc(e,n,t);else if(e.tag===19)Dc(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break a;for(;e.sibling===null;){if(e.return===null||e.return===t)break a;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(i){case`forwards`:for(n=t.child,i=null;n!==null;)e=n.alternate,e!==null&&fo(e)===null&&(i=n),n=n.sibling;n=i,n===null?(i=t.child,t.child=null):(i=n.sibling,n.sibling=null),Oc(t,!1,i,n,a,r);break;case`backwards`:case`unstable_legacy-backwards`:for(n=null,i=t.child,t.child=null;i!==null;){if(e=i.alternate,e!==null&&fo(e)===null){t.child=i;break}e=i.sibling,i.sibling=n,n=i,i=e}Oc(t,!0,n,null,a,r);break;case`together`:Oc(t,!1,null,null,void 0,r);break;default:t.memoizedState=null}return t.child}function Ac(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),Gl|=t.lanes,(n&t.childLanes)===0)if(e!==null){if(Qi(e,t,n,!1),(n&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error(i(153));if(t.child!==null){for(e=t.child,n=di(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=di(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function jc(e,t){return(e.lanes&t)===0?(e=e.dependencies,!!(e!==null&&$i(e))):!0}function Mc(e,t,n){switch(t.tag){case 3:me(t,t.stateNode.containerInfo),Ji(t,sa,e.memoizedState.cache),Hi();break;case 27:case 5:ge(t);break;case 4:me(t,t.stateNode.containerInfo);break;case 10:Ji(t,t.type,t.memoizedProps.value);break;case 31:if(t.memoizedState!==null)return t.flags|=128,oo(t),null;break;case 13:var r=t.memoizedState;if(r!==null)return r.dehydrated===null?(n&t.child.childLanes)===0?(ao(t),e=Ac(e,t,n),e===null?null:e.sibling):Cc(e,t,n):(ao(t),t.flags|=128,null);ao(t);break;case 19:var i=(e.flags&128)!=0;if(r=(n&t.childLanes)!==0,r||=(Qi(e,t,n,!1),(n&t.childLanes)!==0),i){if(r)return kc(e,t,n);t.flags|=128}if(i=t.memoizedState,i!==null&&(i.rendering=null,i.tail=null,i.lastEffect=null),j(uo,uo.current),r)break;return null;case 22:return t.lanes=0,lc(e,t,n,t.pendingProps);case 24:Ji(t,sa,e.memoizedState.cache)}return Ac(e,t,n)}function Nc(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps)ic=!0;else{if(!jc(e,n)&&!(t.flags&128))return ic=!1,Mc(e,t,n);ic=!!(e.flags&131072)}else ic=!1,z&&t.flags&1048576&&Ai(t,Ci,t.index);switch(t.lanes=0,t.tag){case 16:a:{var r=t.pendingProps;if(e=Oa(t.elementType),t.type=e,typeof e==`function`)ui(e)?(r=qs(e,r),t.tag=1,t=vc(null,t,e,r,n)):(t.tag=0,t=gc(null,t,e,r,n));else{if(e!=null){var a=e.$$typeof;if(a===w){t.tag=11,t=oc(null,t,e,r,n);break a}else if(a===ee){t.tag=14,t=sc(null,t,e,r,n);break a}}throw t=oe(e)||e,Error(i(306,t,``))}}return t;case 0:return gc(e,t,t.type,t.pendingProps,n);case 1:return r=t.type,a=qs(r,t.pendingProps),vc(e,t,r,a,n);case 3:a:{if(me(t,t.stateNode.containerInfo),e===null)throw Error(i(387));r=t.pendingProps;var o=t.memoizedState;a=o.element,Ha(e,t),Ya(t,r,null,n);var s=t.memoizedState;if(r=s.cache,Ji(t,sa,r),r!==o.cache&&Zi(t,[sa],n,!0),Ja(),r=s.element,o.isDehydrated)if(o={element:r,isDehydrated:!1,cache:s.cache},t.updateQueue.baseState=o,t.memoizedState=o,t.flags&256){t=yc(e,t,r,n);break a}else if(r!==a){a=yi(Error(i(424)),t),Wi(a),t=yc(e,t,r,n);break a}else{switch(e=t.stateNode.containerInfo,e.nodeType){case 9:e=e.body;break;default:e=e.nodeName===`HTML`?e.ownerDocument.body:e}for(R=cf(e.firstChild),Pi=t,z=!0,Fi=null,Ii=!0,n=za(t,null,r,n),t.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling}else{if(Hi(),r===a){t=Ac(e,t,n);break a}ac(e,t,r,n)}t=t.child}return t;case 26:return hc(e,t),e===null?(n=kf(t.type,null,t.pendingProps,null))?t.memoizedState=n:z||(n=t.type,e=t.pendingProps,r=Bd(N.current).createElement(n),r[dt]=t,r[ft]=e,Pd(r,n,e),wt(r),t.stateNode=r):t.memoizedState=kf(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return ge(t),e===null&&z&&(r=t.stateNode=ff(t.type,t.pendingProps,N.current),Pi=t,Ii=!0,a=R,Zd(t.type)?(lf=a,R=cf(r.firstChild)):R=a),ac(e,t,t.pendingProps.children,n),hc(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&z&&((a=r=R)&&(r=tf(r,t.type,t.pendingProps,Ii),r===null?a=!1:(t.stateNode=r,Pi=t,R=cf(r.firstChild),Ii=!1,a=!0)),a||Ri(t)),ge(t),a=t.type,o=t.pendingProps,s=e===null?null:e.memoizedProps,r=o.children,Ud(a,o)?r=null:s!==null&&Ud(a,s)&&(t.flags|=32),t.memoizedState!==null&&(a=Co(e,t,Eo,null,null,n),Qf._currentValue=a),hc(e,t),ac(e,t,r,n),t.child;case 6:return e===null&&z&&((e=n=R)&&(n=nf(n,t.pendingProps,Ii),n===null?e=!1:(t.stateNode=n,Pi=t,R=null,e=!0)),e||Ri(t)),null;case 13:return Cc(e,t,n);case 4:return me(t,t.stateNode.containerInfo),r=t.pendingProps,e===null?t.child=Ra(t,null,r,n):ac(e,t,r,n),t.child;case 11:return oc(e,t,t.type,t.pendingProps,n);case 7:return ac(e,t,t.pendingProps,n),t.child;case 8:return ac(e,t,t.pendingProps.children,n),t.child;case 12:return ac(e,t,t.pendingProps.children,n),t.child;case 10:return r=t.pendingProps,Ji(t,t.type,r.value),ac(e,t,r.children,n),t.child;case 9:return a=t.type._context,r=t.pendingProps.children,ea(t),a=ta(a),r=r(a),t.flags|=1,ac(e,t,r,n),t.child;case 14:return sc(e,t,t.type,t.pendingProps,n);case 15:return cc(e,t,t.type,t.pendingProps,n);case 19:return kc(e,t,n);case 31:return mc(e,t,n);case 22:return lc(e,t,n,t.pendingProps);case 24:return ea(t),r=ta(sa),e===null?(a=ya(),a===null&&(a=K,o=ca(),a.pooledCache=o,o.refCount++,o!==null&&(a.pooledCacheLanes|=n),a=o),t.memoizedState={parent:r,cache:a},Va(t),Ji(t,sa,a)):((e.lanes&n)!==0&&(Ha(e,t),Ya(t,null,null,n),Ja()),a=e.memoizedState,o=t.memoizedState,a.parent===r?(r=o.cache,Ji(t,sa,r),r!==a.cache&&Zi(t,[sa],n,!0)):(a={parent:r,cache:r},t.memoizedState=a,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=a),Ji(t,sa,r))),ac(e,t,t.pendingProps.children,n),t.child;case 29:throw t.pendingProps}throw Error(i(156,t.tag))}function Pc(e){e.flags|=4}function Fc(e,t,n,r,i){if((t=(e.mode&32)!=0)&&(t=!1),t){if(e.flags|=16777216,(i&335544128)===i)if(e.stateNode.complete)e.flags|=8192;else if(wu())e.flags|=8192;else throw ka=Ta,Ca}else e.flags&=-16777217}function Ic(e,t){if(t.type!==`stylesheet`||t.state.loading&4)e.flags&=-16777217;else if(e.flags|=16777216,!Wf(t))if(wu())e.flags|=8192;else throw ka=Ta,Ca}function Lc(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag===22?536870912:$e(),e.lanes|=t,Yl|=t)}function Rc(e,t){if(!z)switch(e.tailMode){case`hidden`:t=e.tail;for(var n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null;break;case`collapsed`:n=e.tail;for(var r=null;n!==null;)n.alternate!==null&&(r=n),n=n.sibling;r===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null}}function U(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,r=0;if(t)for(var i=e.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags&65011712,r|=i.flags&65011712,i.return=e,i=i.sibling;else for(i=e.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags,r|=i.flags,i.return=e,i=i.sibling;return e.subtreeFlags|=r,e.childLanes=n,t}function zc(e,t,n){var r=t.pendingProps;switch(Mi(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return U(t),null;case 1:return U(t),null;case 3:return n=t.stateNode,r=null,e!==null&&(r=e.memoizedState.cache),t.memoizedState.cache!==r&&(t.flags|=2048),Yi(sa),he(),n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),(e===null||e.child===null)&&(Vi(t)?Pc(t):e===null||e.memoizedState.isDehydrated&&!(t.flags&256)||(t.flags|=1024,Ui())),U(t),null;case 26:var a=t.type,o=t.memoizedState;return e===null?(Pc(t),o===null?(U(t),Fc(t,a,null,r,n)):(U(t),Ic(t,o))):o?o===e.memoizedState?(U(t),t.flags&=-16777217):(Pc(t),U(t),Ic(t,o)):(e=e.memoizedProps,e!==r&&Pc(t),U(t),Fc(t,a,e,r,n)),null;case 27:if(_e(t),n=N.current,a=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==r&&Pc(t);else{if(!r){if(t.stateNode===null)throw Error(i(166));return U(t),null}e=fe.current,Vi(t)?zi(t,e):(e=ff(a,r,n),t.stateNode=e,Pc(t))}return U(t),null;case 5:if(_e(t),a=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==r&&Pc(t);else{if(!r){if(t.stateNode===null)throw Error(i(166));return U(t),null}if(o=fe.current,Vi(t))zi(t,o);else{var s=Bd(N.current);switch(o){case 1:o=s.createElementNS(`http://www.w3.org/2000/svg`,a);break;case 2:o=s.createElementNS(`http://www.w3.org/1998/Math/MathML`,a);break;default:switch(a){case`svg`:o=s.createElementNS(`http://www.w3.org/2000/svg`,a);break;case`math`:o=s.createElementNS(`http://www.w3.org/1998/Math/MathML`,a);break;case`script`:o=s.createElement(`div`),o.innerHTML=`<script><\/script>`,o=o.removeChild(o.firstChild);break;case`select`:o=typeof r.is==`string`?s.createElement(`select`,{is:r.is}):s.createElement(`select`),r.multiple?o.multiple=!0:r.size&&(o.size=r.size);break;default:o=typeof r.is==`string`?s.createElement(a,{is:r.is}):s.createElement(a)}}o[dt]=t,o[ft]=r;a:for(s=t.child;s!==null;){if(s.tag===5||s.tag===6)o.appendChild(s.stateNode);else if(s.tag!==4&&s.tag!==27&&s.child!==null){s.child.return=s,s=s.child;continue}if(s===t)break a;for(;s.sibling===null;){if(s.return===null||s.return===t)break a;s=s.return}s.sibling.return=s.return,s=s.sibling}t.stateNode=o;a:switch(Pd(o,a,r),a){case`button`:case`input`:case`select`:case`textarea`:r=!!r.autoFocus;break a;case`img`:r=!0;break a;default:r=!1}r&&Pc(t)}}return U(t),Fc(t,t.type,e===null?null:e.memoizedProps,t.pendingProps,n),null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==r&&Pc(t);else{if(typeof r!=`string`&&t.stateNode===null)throw Error(i(166));if(e=N.current,Vi(t)){if(e=t.stateNode,n=t.memoizedProps,r=null,a=Pi,a!==null)switch(a.tag){case 27:case 5:r=a.memoizedProps}e[dt]=t,e=!!(e.nodeValue===n||r!==null&&!0===r.suppressHydrationWarning||Md(e.nodeValue,n)),e||Ri(t,!0)}else e=Bd(e).createTextNode(r),e[dt]=t,t.stateNode=e}return U(t),null;case 31:if(n=t.memoizedState,e===null||e.memoizedState!==null){if(r=Vi(t),n!==null){if(e===null){if(!r)throw Error(i(318));if(e=t.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(i(557));e[dt]=t}else Hi(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;U(t),e=!1}else n=Ui(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=n),e=!0;if(!e)return t.flags&256?(lo(t),t):(lo(t),null);if(t.flags&128)throw Error(i(558))}return U(t),null;case 13:if(r=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(a=Vi(t),r!==null&&r.dehydrated!==null){if(e===null){if(!a)throw Error(i(318));if(a=t.memoizedState,a=a===null?null:a.dehydrated,!a)throw Error(i(317));a[dt]=t}else Hi(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;U(t),a=!1}else a=Ui(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=a),a=!0;if(!a)return t.flags&256?(lo(t),t):(lo(t),null)}return lo(t),t.flags&128?(t.lanes=n,t):(n=r!==null,e=e!==null&&e.memoizedState!==null,n&&(r=t.child,a=null,r.alternate!==null&&r.alternate.memoizedState!==null&&r.alternate.memoizedState.cachePool!==null&&(a=r.alternate.memoizedState.cachePool.pool),o=null,r.memoizedState!==null&&r.memoizedState.cachePool!==null&&(o=r.memoizedState.cachePool.pool),o!==a&&(r.flags|=2048)),n!==e&&n&&(t.child.flags|=8192),Lc(t,t.updateQueue),U(t),null);case 4:return he(),e===null&&Sd(t.stateNode.containerInfo),U(t),null;case 10:return Yi(t.type),U(t),null;case 19:if(A(uo),r=t.memoizedState,r===null)return U(t),null;if(a=(t.flags&128)!=0,o=r.rendering,o===null)if(a)Rc(r,!1);else{if(X!==0||e!==null&&e.flags&128)for(e=t.child;e!==null;){if(o=fo(e),o!==null){for(t.flags|=128,Rc(r,!1),e=o.updateQueue,t.updateQueue=e,Lc(t,e),t.subtreeFlags=0,e=n,n=t.child;n!==null;)fi(n,e),n=n.sibling;return j(uo,uo.current&1|2),z&&ki(t,r.treeForkCount),t.child}e=e.sibling}r.tail!==null&&Ae()>tu&&(t.flags|=128,a=!0,Rc(r,!1),t.lanes=4194304)}else{if(!a)if(e=fo(o),e!==null){if(t.flags|=128,a=!0,e=e.updateQueue,t.updateQueue=e,Lc(t,e),Rc(r,!0),r.tail===null&&r.tailMode===`hidden`&&!o.alternate&&!z)return U(t),null}else 2*Ae()-r.renderingStartTime>tu&&n!==536870912&&(t.flags|=128,a=!0,Rc(r,!1),t.lanes=4194304);r.isBackwards?(o.sibling=t.child,t.child=o):(e=r.last,e===null?t.child=o:e.sibling=o,r.last=o)}return r.tail===null?(U(t),null):(e=r.tail,r.rendering=e,r.tail=e.sibling,r.renderingStartTime=Ae(),e.sibling=null,n=uo.current,j(uo,a?n&1|2:n&1),z&&ki(t,r.treeForkCount),e);case 22:case 23:return lo(t),no(),r=t.memoizedState!==null,e===null?r&&(t.flags|=8192):e.memoizedState!==null!==r&&(t.flags|=8192),r?n&536870912&&!(t.flags&128)&&(U(t),t.subtreeFlags&6&&(t.flags|=8192)):U(t),n=t.updateQueue,n!==null&&Lc(t,n.retryQueue),n=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),r=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(r=t.memoizedState.cachePool.pool),r!==n&&(t.flags|=2048),e!==null&&A(va),null;case 24:return n=null,e!==null&&(n=e.memoizedState.cache),t.memoizedState.cache!==n&&(t.flags|=2048),Yi(sa),U(t),null;case 25:return null;case 30:return null}throw Error(i(156,t.tag))}function Bc(e,t){switch(Mi(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return Yi(sa),he(),e=t.flags,e&65536&&!(e&128)?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return _e(t),null;case 31:if(t.memoizedState!==null){if(lo(t),t.alternate===null)throw Error(i(340));Hi()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 13:if(lo(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(i(340));Hi()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return A(uo),null;case 4:return he(),null;case 10:return Yi(t.type),null;case 22:case 23:return lo(t),no(),e!==null&&A(va),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return Yi(sa),null;case 25:return null;default:return null}}function Vc(e,t){switch(Mi(t),t.tag){case 3:Yi(sa),he();break;case 26:case 27:case 5:_e(t);break;case 4:he();break;case 31:t.memoizedState!==null&&lo(t);break;case 13:lo(t);break;case 19:A(uo);break;case 10:Yi(t.type);break;case 22:case 23:lo(t),no(),e!==null&&A(va);break;case 24:Yi(sa)}}function Hc(e,t){try{var n=t.updateQueue,r=n===null?null:n.lastEffect;if(r!==null){var i=r.next;n=i;do{if((n.tag&e)===e){r=void 0;var a=n.create,o=n.inst;r=a(),o.destroy=r}n=n.next}while(n!==i)}}catch(e){Z(t,t.return,e)}}function Uc(e,t,n){try{var r=t.updateQueue,i=r===null?null:r.lastEffect;if(i!==null){var a=i.next;r=a;do{if((r.tag&e)===e){var o=r.inst,s=o.destroy;if(s!==void 0){o.destroy=void 0,i=t;var c=n,l=s;try{l()}catch(e){Z(i,c,e)}}}r=r.next}while(r!==a)}}catch(e){Z(t,t.return,e)}}function Wc(e){var t=e.updateQueue;if(t!==null){var n=e.stateNode;try{Za(t,n)}catch(t){Z(e,e.return,t)}}}function Gc(e,t,n){n.props=qs(e.type,e.memoizedProps),n.state=e.memoizedState;try{n.componentWillUnmount()}catch(n){Z(e,t,n)}}function Kc(e,t){try{var n=e.ref;if(n!==null){switch(e.tag){case 26:case 27:case 5:var r=e.stateNode;break;case 30:r=e.stateNode;break;default:r=e.stateNode}typeof n==`function`?e.refCleanup=n(r):n.current=r}}catch(n){Z(e,t,n)}}function qc(e,t){var n=e.ref,r=e.refCleanup;if(n!==null)if(typeof r==`function`)try{r()}catch(n){Z(e,t,n)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof n==`function`)try{n(null)}catch(n){Z(e,t,n)}else n.current=null}function Jc(e){var t=e.type,n=e.memoizedProps,r=e.stateNode;try{a:switch(t){case`button`:case`input`:case`select`:case`textarea`:n.autoFocus&&r.focus();break a;case`img`:n.src?r.src=n.src:n.srcSet&&(r.srcset=n.srcSet)}}catch(t){Z(e,e.return,t)}}function Yc(e,t,n){try{var r=e.stateNode;Fd(r,e.type,n,t),r[ft]=t}catch(t){Z(e,e.return,t)}}function Xc(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&Zd(e.type)||e.tag===4}function Zc(e){a:for(;;){for(;e.sibling===null;){if(e.return===null||Xc(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&Zd(e.type)||e.flags&2||e.child===null||e.tag===4)continue a;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Qc(e,t,n){var r=e.tag;if(r===5||r===6)e=e.stateNode,t?(n.nodeType===9?n.body:n.nodeName===`HTML`?n.ownerDocument.body:n).insertBefore(e,t):(t=n.nodeType===9?n.body:n.nodeName===`HTML`?n.ownerDocument.body:n,t.appendChild(e),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=en));else if(r!==4&&(r===27&&Zd(e.type)&&(n=e.stateNode,t=null),e=e.child,e!==null))for(Qc(e,t,n),e=e.sibling;e!==null;)Qc(e,t,n),e=e.sibling}function $c(e,t,n){var r=e.tag;if(r===5||r===6)e=e.stateNode,t?n.insertBefore(e,t):n.appendChild(e);else if(r!==4&&(r===27&&Zd(e.type)&&(n=e.stateNode),e=e.child,e!==null))for($c(e,t,n),e=e.sibling;e!==null;)$c(e,t,n),e=e.sibling}function el(e){var t=e.stateNode,n=e.memoizedProps;try{for(var r=e.type,i=t.attributes;i.length;)t.removeAttributeNode(i[0]);Pd(t,r,n),t[dt]=e,t[ft]=n}catch(t){Z(e,e.return,t)}}var tl=!1,nl=!1,rl=!1,il=typeof WeakSet==`function`?WeakSet:Set,al=null;function ol(e,t){if(e=e.containerInfo,Rd=sp,e=Or(e),kr(e)){if(`selectionStart`in e)var n={start:e.selectionStart,end:e.selectionEnd};else a:{n=(n=e.ownerDocument)&&n.defaultView||window;var r=n.getSelection&&n.getSelection();if(r&&r.rangeCount!==0){n=r.anchorNode;var a=r.anchorOffset,o=r.focusNode;r=r.focusOffset;try{n.nodeType,o.nodeType}catch{n=null;break a}var s=0,c=-1,l=-1,u=0,d=0,f=e,p=null;b:for(;;){for(var m;f!==n||a!==0&&f.nodeType!==3||(c=s+a),f!==o||r!==0&&f.nodeType!==3||(l=s+r),f.nodeType===3&&(s+=f.nodeValue.length),(m=f.firstChild)!==null;)p=f,f=m;for(;;){if(f===e)break b;if(p===n&&++u===a&&(c=s),p===o&&++d===r&&(l=s),(m=f.nextSibling)!==null)break;f=p,p=f.parentNode}f=m}n=c===-1||l===-1?null:{start:c,end:l}}else n=null}n||={start:0,end:0}}else n=null;for(zd={focusedElem:e,selectionRange:n},sp=!1,al=t;al!==null;)if(t=al,e=t.child,t.subtreeFlags&1028&&e!==null)e.return=t,al=e;else for(;al!==null;){switch(t=al,o=t.alternate,e=t.flags,t.tag){case 0:if(e&4&&(e=t.updateQueue,e=e===null?null:e.events,e!==null))for(n=0;n<e.length;n++)a=e[n],a.ref.impl=a.nextImpl;break;case 11:case 15:break;case 1:if(e&1024&&o!==null){e=void 0,n=t,a=o.memoizedProps,o=o.memoizedState,r=n.stateNode;try{var h=qs(n.type,a);e=r.getSnapshotBeforeUpdate(h,o),r.__reactInternalSnapshotBeforeUpdate=e}catch(e){Z(n,n.return,e)}}break;case 3:if(e&1024){if(e=t.stateNode.containerInfo,n=e.nodeType,n===9)ef(e);else if(n===1)switch(e.nodeName){case`HEAD`:case`HTML`:case`BODY`:ef(e);break;default:e.textContent=``}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;default:if(e&1024)throw Error(i(163))}if(e=t.sibling,e!==null){e.return=t.return,al=e;break}al=t.return}}function sl(e,t,n){var r=n.flags;switch(n.tag){case 0:case 11:case 15:xl(e,n),r&4&&Hc(5,n);break;case 1:if(xl(e,n),r&4)if(e=n.stateNode,t===null)try{e.componentDidMount()}catch(e){Z(n,n.return,e)}else{var i=qs(n.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(i,t,e.__reactInternalSnapshotBeforeUpdate)}catch(e){Z(n,n.return,e)}}r&64&&Wc(n),r&512&&Kc(n,n.return);break;case 3:if(xl(e,n),r&64&&(e=n.updateQueue,e!==null)){if(t=null,n.child!==null)switch(n.child.tag){case 27:case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}try{Za(e,t)}catch(e){Z(n,n.return,e)}}break;case 27:t===null&&r&4&&el(n);case 26:case 5:xl(e,n),t===null&&r&4&&Jc(n),r&512&&Kc(n,n.return);break;case 12:xl(e,n);break;case 31:xl(e,n),r&4&&fl(e,n);break;case 13:xl(e,n),r&4&&pl(e,n),r&64&&(e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(n=Ju.bind(null,n),sf(e,n))));break;case 22:if(r=n.memoizedState!==null||tl,!r){t=t!==null&&t.memoizedState!==null||nl,i=tl;var a=nl;tl=r,(nl=t)&&!a?Cl(e,n,(n.subtreeFlags&8772)!=0):xl(e,n),tl=i,nl=a}break;case 30:break;default:xl(e,n)}}function cl(e){var t=e.alternate;t!==null&&(e.alternate=null,cl(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&yt(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var W=null,ll=!1;function ul(e,t,n){for(n=n.child;n!==null;)dl(e,t,n),n=n.sibling}function dl(e,t,n){if(Be&&typeof Be.onCommitFiberUnmount==`function`)try{Be.onCommitFiberUnmount(ze,n)}catch{}switch(n.tag){case 26:nl||qc(n,t),ul(e,t,n),n.memoizedState?n.memoizedState.count--:n.stateNode&&(n=n.stateNode,n.parentNode.removeChild(n));break;case 27:nl||qc(n,t);var r=W,i=ll;Zd(n.type)&&(W=n.stateNode,ll=!1),ul(e,t,n),pf(n.stateNode),W=r,ll=i;break;case 5:nl||qc(n,t);case 6:if(r=W,i=ll,W=null,ul(e,t,n),W=r,ll=i,W!==null)if(ll)try{(W.nodeType===9?W.body:W.nodeName===`HTML`?W.ownerDocument.body:W).removeChild(n.stateNode)}catch(e){Z(n,t,e)}else try{W.removeChild(n.stateNode)}catch(e){Z(n,t,e)}break;case 18:W!==null&&(ll?(e=W,Qd(e.nodeType===9?e.body:e.nodeName===`HTML`?e.ownerDocument.body:e,n.stateNode),Np(e)):Qd(W,n.stateNode));break;case 4:r=W,i=ll,W=n.stateNode.containerInfo,ll=!0,ul(e,t,n),W=r,ll=i;break;case 0:case 11:case 14:case 15:Uc(2,n,t),nl||Uc(4,n,t),ul(e,t,n);break;case 1:nl||(qc(n,t),r=n.stateNode,typeof r.componentWillUnmount==`function`&&Gc(n,t,r)),ul(e,t,n);break;case 21:ul(e,t,n);break;case 22:nl=(r=nl)||n.memoizedState!==null,ul(e,t,n),nl=r;break;default:ul(e,t,n)}}function fl(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{Np(e)}catch(e){Z(t,t.return,e)}}}function pl(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{Np(e)}catch(e){Z(t,t.return,e)}}function ml(e){switch(e.tag){case 31:case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new il),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new il),t;default:throw Error(i(435,e.tag))}}function hl(e,t){var n=ml(e);t.forEach(function(t){if(!n.has(t)){n.add(t);var r=Yu.bind(null,e,t);t.then(r,r)}})}function gl(e,t){var n=t.deletions;if(n!==null)for(var r=0;r<n.length;r++){var a=n[r],o=e,s=t,c=s;a:for(;c!==null;){switch(c.tag){case 27:if(Zd(c.type)){W=c.stateNode,ll=!1;break a}break;case 5:W=c.stateNode,ll=!1;break a;case 3:case 4:W=c.stateNode.containerInfo,ll=!0;break a}c=c.return}if(W===null)throw Error(i(160));dl(o,s,a),W=null,ll=!1,o=a.alternate,o!==null&&(o.return=null),a.return=null}if(t.subtreeFlags&13886)for(t=t.child;t!==null;)vl(t,e),t=t.sibling}var _l=null;function vl(e,t){var n=e.alternate,r=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:gl(t,e),yl(e),r&4&&(Uc(3,e,e.return),Hc(3,e),Uc(5,e,e.return));break;case 1:gl(t,e),yl(e),r&512&&(nl||n===null||qc(n,n.return)),r&64&&tl&&(e=e.updateQueue,e!==null&&(r=e.callbacks,r!==null&&(n=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=n===null?r:n.concat(r))));break;case 26:var a=_l;if(gl(t,e),yl(e),r&512&&(nl||n===null||qc(n,n.return)),r&4){var o=n===null?null:n.memoizedState;if(r=e.memoizedState,n===null)if(r===null)if(e.stateNode===null){a:{r=e.type,n=e.memoizedProps,a=a.ownerDocument||a;b:switch(r){case`title`:o=a.getElementsByTagName(`title`)[0],(!o||o[vt]||o[dt]||o.namespaceURI===`http://www.w3.org/2000/svg`||o.hasAttribute(`itemprop`))&&(o=a.createElement(r),a.head.insertBefore(o,a.querySelector(`head > title`))),Pd(o,r,n),o[dt]=e,wt(o),r=o;break a;case`link`:var s=Vf(`link`,`href`,a).get(r+(n.href||``));if(s){for(var c=0;c<s.length;c++)if(o=s[c],o.getAttribute(`href`)===(n.href==null||n.href===``?null:n.href)&&o.getAttribute(`rel`)===(n.rel==null?null:n.rel)&&o.getAttribute(`title`)===(n.title==null?null:n.title)&&o.getAttribute(`crossorigin`)===(n.crossOrigin==null?null:n.crossOrigin)){s.splice(c,1);break b}}o=a.createElement(r),Pd(o,r,n),a.head.appendChild(o);break;case`meta`:if(s=Vf(`meta`,`content`,a).get(r+(n.content||``))){for(c=0;c<s.length;c++)if(o=s[c],o.getAttribute(`content`)===(n.content==null?null:``+n.content)&&o.getAttribute(`name`)===(n.name==null?null:n.name)&&o.getAttribute(`property`)===(n.property==null?null:n.property)&&o.getAttribute(`http-equiv`)===(n.httpEquiv==null?null:n.httpEquiv)&&o.getAttribute(`charset`)===(n.charSet==null?null:n.charSet)){s.splice(c,1);break b}}o=a.createElement(r),Pd(o,r,n),a.head.appendChild(o);break;default:throw Error(i(468,r))}o[dt]=e,wt(o),r=o}e.stateNode=r}else Hf(a,e.type,e.stateNode);else e.stateNode=If(a,r,e.memoizedProps);else o===r?r===null&&e.stateNode!==null&&Yc(e,e.memoizedProps,n.memoizedProps):(o===null?n.stateNode!==null&&(n=n.stateNode,n.parentNode.removeChild(n)):o.count--,r===null?Hf(a,e.type,e.stateNode):If(a,r,e.memoizedProps))}break;case 27:gl(t,e),yl(e),r&512&&(nl||n===null||qc(n,n.return)),n!==null&&r&4&&Yc(e,e.memoizedProps,n.memoizedProps);break;case 5:if(gl(t,e),yl(e),r&512&&(nl||n===null||qc(n,n.return)),e.flags&32){a=e.stateNode;try{I(a,``)}catch(t){Z(e,e.return,t)}}r&4&&e.stateNode!=null&&(a=e.memoizedProps,Yc(e,a,n===null?a:n.memoizedProps)),r&1024&&(rl=!0);break;case 6:if(gl(t,e),yl(e),r&4){if(e.stateNode===null)throw Error(i(162));r=e.memoizedProps,n=e.stateNode;try{n.nodeValue=r}catch(t){Z(e,e.return,t)}}break;case 3:if(Bf=null,a=_l,_l=gf(t.containerInfo),gl(t,e),_l=a,yl(e),r&4&&n!==null&&n.memoizedState.isDehydrated)try{Np(t.containerInfo)}catch(t){Z(e,e.return,t)}rl&&(rl=!1,bl(e));break;case 4:r=_l,_l=gf(e.stateNode.containerInfo),gl(t,e),yl(e),_l=r;break;case 12:gl(t,e),yl(e);break;case 31:gl(t,e),yl(e),r&4&&(r=e.updateQueue,r!==null&&(e.updateQueue=null,hl(e,r)));break;case 13:gl(t,e),yl(e),e.child.flags&8192&&e.memoizedState!==null!=(n!==null&&n.memoizedState!==null)&&($l=Ae()),r&4&&(r=e.updateQueue,r!==null&&(e.updateQueue=null,hl(e,r)));break;case 22:a=e.memoizedState!==null;var l=n!==null&&n.memoizedState!==null,u=tl,d=nl;if(tl=u||a,nl=d||l,gl(t,e),nl=d,tl=u,yl(e),r&8192)a:for(t=e.stateNode,t._visibility=a?t._visibility&-2:t._visibility|1,a&&(n===null||l||tl||nl||Sl(e)),n=null,t=e;;){if(t.tag===5||t.tag===26){if(n===null){l=n=t;try{if(o=l.stateNode,a)s=o.style,typeof s.setProperty==`function`?s.setProperty(`display`,`none`,`important`):s.display=`none`;else{c=l.stateNode;var f=l.memoizedProps.style,p=f!=null&&f.hasOwnProperty(`display`)?f.display:null;c.style.display=p==null||typeof p==`boolean`?``:(``+p).trim()}}catch(e){Z(l,l.return,e)}}}else if(t.tag===6){if(n===null){l=t;try{l.stateNode.nodeValue=a?``:l.memoizedProps}catch(e){Z(l,l.return,e)}}}else if(t.tag===18){if(n===null){l=t;try{var m=l.stateNode;a?$d(m,!0):$d(l.stateNode,!1)}catch(e){Z(l,l.return,e)}}}else if((t.tag!==22&&t.tag!==23||t.memoizedState===null||t===e)&&t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break a;for(;t.sibling===null;){if(t.return===null||t.return===e)break a;n===t&&(n=null),t=t.return}n===t&&(n=null),t.sibling.return=t.return,t=t.sibling}r&4&&(r=e.updateQueue,r!==null&&(n=r.retryQueue,n!==null&&(r.retryQueue=null,hl(e,n))));break;case 19:gl(t,e),yl(e),r&4&&(r=e.updateQueue,r!==null&&(e.updateQueue=null,hl(e,r)));break;case 30:break;case 21:break;default:gl(t,e),yl(e)}}function yl(e){var t=e.flags;if(t&2){try{for(var n,r=e.return;r!==null;){if(Xc(r)){n=r;break}r=r.return}if(n==null)throw Error(i(160));switch(n.tag){case 27:var a=n.stateNode;$c(e,Zc(e),a);break;case 5:var o=n.stateNode;n.flags&32&&(I(o,``),n.flags&=-33),$c(e,Zc(e),o);break;case 3:case 4:var s=n.stateNode.containerInfo;Qc(e,Zc(e),s);break;default:throw Error(i(161))}}catch(t){Z(e,e.return,t)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function bl(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;bl(t),t.tag===5&&t.flags&1024&&t.stateNode.reset(),e=e.sibling}}function xl(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)sl(e,t.alternate,t),t=t.sibling}function Sl(e){for(e=e.child;e!==null;){var t=e;switch(t.tag){case 0:case 11:case 14:case 15:Uc(4,t,t.return),Sl(t);break;case 1:qc(t,t.return);var n=t.stateNode;typeof n.componentWillUnmount==`function`&&Gc(t,t.return,n),Sl(t);break;case 27:pf(t.stateNode);case 26:case 5:qc(t,t.return),Sl(t);break;case 22:t.memoizedState===null&&Sl(t);break;case 30:Sl(t);break;default:Sl(t)}e=e.sibling}}function Cl(e,t,n){for(n&&=(t.subtreeFlags&8772)!=0,t=t.child;t!==null;){var r=t.alternate,i=e,a=t,o=a.flags;switch(a.tag){case 0:case 11:case 15:Cl(i,a,n),Hc(4,a);break;case 1:if(Cl(i,a,n),r=a,i=r.stateNode,typeof i.componentDidMount==`function`)try{i.componentDidMount()}catch(e){Z(r,r.return,e)}if(r=a,i=r.updateQueue,i!==null){var s=r.stateNode;try{var c=i.shared.hiddenCallbacks;if(c!==null)for(i.shared.hiddenCallbacks=null,i=0;i<c.length;i++)Xa(c[i],s)}catch(e){Z(r,r.return,e)}}n&&o&64&&Wc(a),Kc(a,a.return);break;case 27:el(a);case 26:case 5:Cl(i,a,n),n&&r===null&&o&4&&Jc(a),Kc(a,a.return);break;case 12:Cl(i,a,n);break;case 31:Cl(i,a,n),n&&o&4&&fl(i,a);break;case 13:Cl(i,a,n),n&&o&4&&pl(i,a);break;case 22:a.memoizedState===null&&Cl(i,a,n),Kc(a,a.return);break;case 30:break;default:Cl(i,a,n)}t=t.sibling}}function wl(e,t){var n=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==n&&(e!=null&&e.refCount++,n!=null&&la(n))}function Tl(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&la(e))}function El(e,t,n,r){if(t.subtreeFlags&10256)for(t=t.child;t!==null;)Dl(e,t,n,r),t=t.sibling}function Dl(e,t,n,r){var i=t.flags;switch(t.tag){case 0:case 11:case 15:El(e,t,n,r),i&2048&&Hc(9,t);break;case 1:El(e,t,n,r);break;case 3:El(e,t,n,r),i&2048&&(e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&la(e)));break;case 12:if(i&2048){El(e,t,n,r),e=t.stateNode;try{var a=t.memoizedProps,o=a.id,s=a.onPostCommit;typeof s==`function`&&s(o,t.alternate===null?`mount`:`update`,e.passiveEffectDuration,-0)}catch(e){Z(t,t.return,e)}}else El(e,t,n,r);break;case 31:El(e,t,n,r);break;case 13:El(e,t,n,r);break;case 23:break;case 22:a=t.stateNode,o=t.alternate,t.memoizedState===null?a._visibility&2?El(e,t,n,r):(a._visibility|=2,Ol(e,t,n,r,(t.subtreeFlags&10256)!=0||!1)):a._visibility&2?El(e,t,n,r):kl(e,t),i&2048&&wl(o,t);break;case 24:El(e,t,n,r),i&2048&&Tl(t.alternate,t);break;default:El(e,t,n,r)}}function Ol(e,t,n,r,i){for(i&&=(t.subtreeFlags&10256)!=0||!1,t=t.child;t!==null;){var a=e,o=t,s=n,c=r,l=o.flags;switch(o.tag){case 0:case 11:case 15:Ol(a,o,s,c,i),Hc(8,o);break;case 23:break;case 22:var u=o.stateNode;o.memoizedState===null?(u._visibility|=2,Ol(a,o,s,c,i)):u._visibility&2?Ol(a,o,s,c,i):kl(a,o),i&&l&2048&&wl(o.alternate,o);break;case 24:Ol(a,o,s,c,i),i&&l&2048&&Tl(o.alternate,o);break;default:Ol(a,o,s,c,i)}t=t.sibling}}function kl(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var n=e,r=t,i=r.flags;switch(r.tag){case 22:kl(n,r),i&2048&&wl(r.alternate,r);break;case 24:kl(n,r),i&2048&&Tl(r.alternate,r);break;default:kl(n,r)}t=t.sibling}}var Al=8192;function jl(e,t,n){if(e.subtreeFlags&Al)for(e=e.child;e!==null;)Ml(e,t,n),e=e.sibling}function Ml(e,t,n){switch(e.tag){case 26:jl(e,t,n),e.flags&Al&&e.memoizedState!==null&&Gf(n,_l,e.memoizedState,e.memoizedProps);break;case 5:jl(e,t,n);break;case 3:case 4:var r=_l;_l=gf(e.stateNode.containerInfo),jl(e,t,n),_l=r;break;case 22:e.memoizedState===null&&(r=e.alternate,r!==null&&r.memoizedState!==null?(r=Al,Al=16777216,jl(e,t,n),Al=r):jl(e,t,n));break;default:jl(e,t,n)}}function Nl(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function Pl(e){var t=e.deletions;if(e.flags&16){if(t!==null)for(var n=0;n<t.length;n++){var r=t[n];al=r,Ll(r,e)}Nl(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)Fl(e),e=e.sibling}function Fl(e){switch(e.tag){case 0:case 11:case 15:Pl(e),e.flags&2048&&Uc(9,e,e.return);break;case 3:Pl(e);break;case 12:Pl(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,Il(e)):Pl(e);break;default:Pl(e)}}function Il(e){var t=e.deletions;if(e.flags&16){if(t!==null)for(var n=0;n<t.length;n++){var r=t[n];al=r,Ll(r,e)}Nl(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:Uc(8,t,t.return),Il(t);break;case 22:n=t.stateNode,n._visibility&2&&(n._visibility&=-3,Il(t));break;default:Il(t)}e=e.sibling}}function Ll(e,t){for(;al!==null;){var n=al;switch(n.tag){case 0:case 11:case 15:Uc(8,n,t);break;case 23:case 22:if(n.memoizedState!==null&&n.memoizedState.cachePool!==null){var r=n.memoizedState.cachePool.pool;r!=null&&r.refCount++}break;case 24:la(n.memoizedState.cache)}if(r=n.child,r!==null)r.return=n,al=r;else a:for(n=e;al!==null;){r=al;var i=r.sibling,a=r.return;if(cl(r),r===n){al=null;break a}if(i!==null){i.return=a,al=i;break a}al=a}}}var Rl={getCacheForType:function(e){var t=ta(sa),n=t.data.get(e);return n===void 0&&(n=e(),t.data.set(e,n)),n},cacheSignal:function(){return ta(sa).controller.signal}},zl=typeof WeakMap==`function`?WeakMap:Map,G=0,K=null,q=null,J=0,Y=0,Bl=null,Vl=!1,Hl=!1,Ul=!1,Wl=0,X=0,Gl=0,Kl=0,ql=0,Jl=0,Yl=0,Xl=null,Zl=null,Ql=!1,$l=0,eu=0,tu=1/0,nu=null,ru=null,iu=0,au=null,ou=null,su=0,cu=0,lu=null,uu=null,du=0,fu=null;function pu(){return G&2&&J!==0?J&-J:O.T===null?ct():dd()}function mu(){if(Jl===0)if(!(J&536870912)||z){var e=qe;qe<<=1,!(qe&3932160)&&(qe=262144),Jl=e}else Jl=536870912;return e=ro.current,e!==null&&(e.flags|=32),Jl}function hu(e,t,n){(e===K&&(Y===2||Y===9)||e.cancelPendingCommit!==null)&&(Su(e,0),yu(e,J,Jl,!1)),tt(e,n),(!(G&2)||e!==K)&&(e===K&&(!(G&2)&&(Kl|=n),X===4&&yu(e,J,Jl,!1)),rd(e))}function gu(e,t,n){if(G&6)throw Error(i(327));var r=!n&&(t&127)==0&&(t&e.expiredLanes)===0||Ze(e,t),a=r?Au(e,t):Ou(e,t,!0),o=r;do{if(a===0){Hl&&!r&&yu(e,t,0,!1);break}else{if(n=e.current.alternate,o&&!vu(n)){a=Ou(e,t,!1),o=!1;continue}if(a===2){if(o=t,e.errorRecoveryDisabledLanes&o)var s=0;else s=e.pendingLanes&-536870913,s=s===0?s&536870912?536870912:0:s;if(s!==0){t=s;a:{var c=e;a=Xl;var l=c.current.memoizedState.isDehydrated;if(l&&(Su(c,s).flags|=256),s=Ou(c,s,!1),s!==2){if(Ul&&!l){c.errorRecoveryDisabledLanes|=o,Kl|=o,a=4;break a}o=Zl,Zl=a,o!==null&&(Zl===null?Zl=o:Zl.push.apply(Zl,o))}a=s}if(o=!1,a!==2)continue}}if(a===1){Su(e,0),yu(e,t,0,!0);break}a:{switch(r=e,o=a,o){case 0:case 1:throw Error(i(345));case 4:if((t&4194048)!==t)break;case 6:yu(r,t,Jl,!Vl);break a;case 2:Zl=null;break;case 3:case 5:break;default:throw Error(i(329))}if((t&62914560)===t&&(a=$l+300-Ae(),10<a)){if(yu(r,t,Jl,!Vl),Xe(r,0,!0)!==0)break a;su=t,r.timeoutHandle=Kd(_u.bind(null,r,n,Zl,nu,Ql,t,Jl,Kl,Yl,Vl,o,`Throttled`,-0,0),a);break a}_u(r,n,Zl,nu,Ql,t,Jl,Kl,Yl,Vl,o,null,-0,0)}}break}while(1);rd(e)}function _u(e,t,n,r,i,a,o,s,c,l,u,d,f,p){if(e.timeoutHandle=-1,d=t.subtreeFlags,d&8192||(d&16785408)==16785408){d={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:en},Ml(t,a,d);var m=(a&62914560)===a?$l-Ae():(a&4194048)===a?eu-Ae():0;if(m=qf(d,m),m!==null){su=a,e.cancelPendingCommit=m(Lu.bind(null,e,t,a,n,r,i,o,s,c,u,d,null,f,p)),yu(e,a,o,!l);return}}Lu(e,t,a,n,r,i,o,s,c)}function vu(e){for(var t=e;;){var n=t.tag;if((n===0||n===11||n===15)&&t.flags&16384&&(n=t.updateQueue,n!==null&&(n=n.stores,n!==null)))for(var r=0;r<n.length;r++){var i=n[r],a=i.getSnapshot;i=i.value;try{if(!Cr(a(),i))return!1}catch{return!1}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function yu(e,t,n,r){t&=~ql,t&=~Kl,e.suspendedLanes|=t,e.pingedLanes&=~t,r&&(e.warmLanes|=t),r=e.expirationTimes;for(var i=t;0<i;){var a=31-He(i),o=1<<a;r[a]=-1,i&=~o}n!==0&&rt(e,n,t)}function bu(){return G&6?!0:(id(0,!1),!1)}function xu(){if(q!==null){if(Y===0)var e=q.return;else e=q,qi=Ki=null,ko(e),Ma=null,Na=0,e=q;for(;e!==null;)Vc(e.alternate,e),e=e.return;q=null}}function Su(e,t){var n=e.timeoutHandle;n!==-1&&(e.timeoutHandle=-1,qd(n)),n=e.cancelPendingCommit,n!==null&&(e.cancelPendingCommit=null,n()),su=0,xu(),K=e,q=n=di(e.current,null),J=t,Y=0,Bl=null,Vl=!1,Hl=Ze(e,t),Ul=!1,Yl=Jl=ql=Kl=Gl=X=0,Zl=Xl=null,Ql=!1,t&8&&(t|=t&32);var r=e.entangledLanes;if(r!==0)for(e=e.entanglements,r&=t;0<r;){var i=31-He(r),a=1<<i;t|=e[i],r&=~a}return Wl=t,ti(),n}function Cu(e,t){B=null,O.H=zs,t===Sa||t===wa?(t=Aa(),Y=3):t===Ca?(t=Aa(),Y=4):Y=t===rc?8:typeof t==`object`&&t&&typeof t.then==`function`?6:1,Bl=t,q===null&&(X=1,Zs(e,yi(t,e.current)))}function wu(){var e=ro.current;return e===null?!0:(J&4194048)===J?io===null:(J&62914560)===J||J&536870912?e===io:!1}function Tu(){var e=O.H;return O.H=zs,e===null?zs:e}function Eu(){var e=O.A;return O.A=Rl,e}function Du(){X=4,Vl||(J&4194048)!==J&&ro.current!==null||(Hl=!0),!(Gl&134217727)&&!(Kl&134217727)||K===null||yu(K,J,Jl,!1)}function Ou(e,t,n){var r=G;G|=2;var i=Tu(),a=Eu();(K!==e||J!==t)&&(nu=null,Su(e,t)),t=!1;var o=X;a:do try{if(Y!==0&&q!==null){var s=q,c=Bl;switch(Y){case 8:xu(),o=6;break a;case 3:case 2:case 9:case 6:ro.current===null&&(t=!0);var l=Y;if(Y=0,Bl=null,Pu(e,s,c,l),n&&Hl){o=0;break a}break;default:l=Y,Y=0,Bl=null,Pu(e,s,c,l)}}ku(),o=X;break}catch(t){Cu(e,t)}while(1);return t&&e.shellSuspendCounter++,qi=Ki=null,G=r,O.H=i,O.A=a,q===null&&(K=null,J=0,ti()),o}function ku(){for(;q!==null;)Mu(q)}function Au(e,t){var n=G;G|=2;var r=Tu(),a=Eu();K!==e||J!==t?(nu=null,tu=Ae()+500,Su(e,t)):Hl=Ze(e,t);a:do try{if(Y!==0&&q!==null){t=q;var o=Bl;b:switch(Y){case 1:Y=0,Bl=null,Pu(e,t,o,1);break;case 2:case 9:if(Ea(o)){Y=0,Bl=null,Nu(t);break}t=function(){Y!==2&&Y!==9||K!==e||(Y=7),rd(e)},o.then(t,t);break a;case 3:Y=7;break a;case 4:Y=5;break a;case 7:Ea(o)?(Y=0,Bl=null,Nu(t)):(Y=0,Bl=null,Pu(e,t,o,7));break;case 5:var s=null;switch(q.tag){case 26:s=q.memoizedState;case 5:case 27:var c=q;if(s?Wf(s):c.stateNode.complete){Y=0,Bl=null;var l=c.sibling;if(l!==null)q=l;else{var u=c.return;u===null?q=null:(q=u,Fu(u))}break b}}Y=0,Bl=null,Pu(e,t,o,5);break;case 6:Y=0,Bl=null,Pu(e,t,o,6);break;case 8:xu(),X=6;break a;default:throw Error(i(462))}}ju();break}catch(t){Cu(e,t)}while(1);return qi=Ki=null,O.H=r,O.A=a,G=n,q===null?(K=null,J=0,ti(),X):0}function ju(){for(;q!==null&&!Oe();)Mu(q)}function Mu(e){var t=Nc(e.alternate,e,Wl);e.memoizedProps=e.pendingProps,t===null?Fu(e):q=t}function Nu(e){var t=e,n=t.alternate;switch(t.tag){case 15:case 0:t=_c(n,t,t.pendingProps,t.type,void 0,J);break;case 11:t=_c(n,t,t.pendingProps,t.type.render,t.ref,J);break;case 5:ko(t);default:Vc(n,t),t=q=fi(t,Wl),t=Nc(n,t,Wl)}e.memoizedProps=e.pendingProps,t===null?Fu(e):q=t}function Pu(e,t,n,r){qi=Ki=null,ko(t),Ma=null,Na=0;var i=t.return;try{if(nc(e,i,t,n,J)){X=1,Zs(e,yi(n,e.current)),q=null;return}}catch(t){if(i!==null)throw q=i,t;X=1,Zs(e,yi(n,e.current)),q=null;return}t.flags&32768?(z||r===1?e=!0:Hl||J&536870912?e=!1:(Vl=e=!0,(r===2||r===9||r===3||r===6)&&(r=ro.current,r!==null&&r.tag===13&&(r.flags|=16384))),Iu(t,e)):Fu(t)}function Fu(e){var t=e;do{if(t.flags&32768){Iu(t,Vl);return}e=t.return;var n=zc(t.alternate,t,Wl);if(n!==null){q=n;return}if(t=t.sibling,t!==null){q=t;return}q=t=e}while(t!==null);X===0&&(X=5)}function Iu(e,t){do{var n=Bc(e.alternate,e);if(n!==null){n.flags&=32767,q=n;return}if(n=e.return,n!==null&&(n.flags|=32768,n.subtreeFlags=0,n.deletions=null),!t&&(e=e.sibling,e!==null)){q=e;return}q=e=n}while(e!==null);X=6,q=null}function Lu(e,t,n,r,a,o,s,c,l){e.cancelPendingCommit=null;do Hu();while(iu!==0);if(G&6)throw Error(i(327));if(t!==null){if(t===e.current)throw Error(i(177));if(o=t.lanes|t.childLanes,o|=ei,nt(e,n,o,s,c,l),e===K&&(q=K=null,J=0),ou=t,au=e,su=n,cu=o,lu=a,uu=r,t.subtreeFlags&10256||t.flags&10256?(e.callbackNode=null,e.callbackPriority=0,Xu(Pe,function(){return Uu(),null})):(e.callbackNode=null,e.callbackPriority=0),r=(t.flags&13878)!=0,t.subtreeFlags&13878||r){r=O.T,O.T=null,a=k.p,k.p=2,s=G,G|=4;try{ol(e,t,n)}finally{G=s,k.p=a,O.T=r}}iu=1,Ru(),zu(),Bu()}}function Ru(){if(iu===1){iu=0;var e=au,t=ou,n=(t.flags&13878)!=0;if(t.subtreeFlags&13878||n){n=O.T,O.T=null;var r=k.p;k.p=2;var i=G;G|=4;try{vl(t,e);var a=zd,o=Or(e.containerInfo),s=a.focusedElem,c=a.selectionRange;if(o!==s&&s&&s.ownerDocument&&Dr(s.ownerDocument.documentElement,s)){if(c!==null&&kr(s)){var l=c.start,u=c.end;if(u===void 0&&(u=l),`selectionStart`in s)s.selectionStart=l,s.selectionEnd=Math.min(u,s.value.length);else{var d=s.ownerDocument||document,f=d&&d.defaultView||window;if(f.getSelection){var p=f.getSelection(),m=s.textContent.length,h=Math.min(c.start,m),g=c.end===void 0?h:Math.min(c.end,m);!p.extend&&h>g&&(o=g,g=h,h=o);var _=Er(s,h),v=Er(s,g);if(_&&v&&(p.rangeCount!==1||p.anchorNode!==_.node||p.anchorOffset!==_.offset||p.focusNode!==v.node||p.focusOffset!==v.offset)){var y=d.createRange();y.setStart(_.node,_.offset),p.removeAllRanges(),h>g?(p.addRange(y),p.extend(v.node,v.offset)):(y.setEnd(v.node,v.offset),p.addRange(y))}}}}for(d=[],p=s;p=p.parentNode;)p.nodeType===1&&d.push({element:p,left:p.scrollLeft,top:p.scrollTop});for(typeof s.focus==`function`&&s.focus(),s=0;s<d.length;s++){var b=d[s];b.element.scrollLeft=b.left,b.element.scrollTop=b.top}}sp=!!Rd,zd=Rd=null}finally{G=i,k.p=r,O.T=n}}e.current=t,iu=2}}function zu(){if(iu===2){iu=0;var e=au,t=ou,n=(t.flags&8772)!=0;if(t.subtreeFlags&8772||n){n=O.T,O.T=null;var r=k.p;k.p=2;var i=G;G|=4;try{sl(e,t.alternate,t)}finally{G=i,k.p=r,O.T=n}}iu=3}}function Bu(){if(iu===4||iu===3){iu=0,ke();var e=au,t=ou,n=su,r=uu;t.subtreeFlags&10256||t.flags&10256?iu=5:(iu=0,ou=au=null,Vu(e,e.pendingLanes));var i=e.pendingLanes;if(i===0&&(ru=null),st(n),t=t.stateNode,Be&&typeof Be.onCommitFiberRoot==`function`)try{Be.onCommitFiberRoot(ze,t,void 0,(t.current.flags&128)==128)}catch{}if(r!==null){t=O.T,i=k.p,k.p=2,O.T=null;try{for(var a=e.onRecoverableError,o=0;o<r.length;o++){var s=r[o];a(s.value,{componentStack:s.stack})}}finally{O.T=t,k.p=i}}su&3&&Hu(),rd(e),i=e.pendingLanes,n&261930&&i&42?e===fu?du++:(du=0,fu=e):du=0,id(0,!1)}}function Vu(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,la(t)))}function Hu(){return Ru(),zu(),Bu(),Uu()}function Uu(){if(iu!==5)return!1;var e=au,t=cu;cu=0;var n=st(su),r=O.T,a=k.p;try{k.p=32>n?32:n,O.T=null,n=lu,lu=null;var o=au,s=su;if(iu=0,ou=au=null,su=0,G&6)throw Error(i(331));var c=G;if(G|=4,Fl(o.current),Dl(o,o.current,s,n),G=c,id(0,!1),Be&&typeof Be.onPostCommitFiberRoot==`function`)try{Be.onPostCommitFiberRoot(ze,o)}catch{}return!0}finally{k.p=a,O.T=r,Vu(e,t)}}function Wu(e,t,n){t=yi(n,t),t=$s(e.stateNode,t,2),e=Wa(e,t,2),e!==null&&(tt(e,2),rd(e))}function Z(e,t,n){if(e.tag===3)Wu(e,e,n);else for(;t!==null;){if(t.tag===3){Wu(t,e,n);break}else if(t.tag===1){var r=t.stateNode;if(typeof t.type.getDerivedStateFromError==`function`||typeof r.componentDidCatch==`function`&&(ru===null||!ru.has(r))){e=yi(n,e),n=ec(2),r=Wa(t,n,2),r!==null&&(tc(n,r,t,e),tt(r,2),rd(r));break}}t=t.return}}function Gu(e,t,n){var r=e.pingCache;if(r===null){r=e.pingCache=new zl;var i=new Set;r.set(t,i)}else i=r.get(t),i===void 0&&(i=new Set,r.set(t,i));i.has(n)||(Ul=!0,i.add(n),e=Ku.bind(null,e,t,n),t.then(e,e))}function Ku(e,t,n){var r=e.pingCache;r!==null&&r.delete(t),e.pingedLanes|=e.suspendedLanes&n,e.warmLanes&=~n,K===e&&(J&n)===n&&(X===4||X===3&&(J&62914560)===J&&300>Ae()-$l?!(G&2)&&Su(e,0):ql|=n,Yl===J&&(Yl=0)),rd(e)}function qu(e,t){t===0&&(t=$e()),e=ii(e,t),e!==null&&(tt(e,t),rd(e))}function Ju(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),qu(e,n)}function Yu(e,t){var n=0;switch(e.tag){case 31:case 13:var r=e.stateNode,a=e.memoizedState;a!==null&&(n=a.retryLane);break;case 19:r=e.stateNode;break;case 22:r=e.stateNode._retryCache;break;default:throw Error(i(314))}r!==null&&r.delete(t),qu(e,n)}function Xu(e,t){return Ee(e,t)}var Zu=null,Qu=null,$u=!1,ed=!1,td=!1,nd=0;function rd(e){e!==Qu&&e.next===null&&(Qu===null?Zu=Qu=e:Qu=Qu.next=e),ed=!0,$u||($u=!0,ud())}function id(e,t){if(!td&&ed){td=!0;do for(var n=!1,r=Zu;r!==null;){if(!t)if(e!==0){var i=r.pendingLanes;if(i===0)var a=0;else{var o=r.suspendedLanes,s=r.pingedLanes;a=(1<<31-He(42|e)+1)-1,a&=i&~(o&~s),a=a&201326741?a&201326741|1:a?a|2:0}a!==0&&(n=!0,ld(r,a))}else a=J,a=Xe(r,r===K?a:0,r.cancelPendingCommit!==null||r.timeoutHandle!==-1),!(a&3)||Ze(r,a)||(n=!0,ld(r,a));r=r.next}while(n);td=!1}}function ad(){od()}function od(){ed=$u=!1;var e=0;nd!==0&&Gd()&&(e=nd);for(var t=Ae(),n=null,r=Zu;r!==null;){var i=r.next,a=sd(r,t);a===0?(r.next=null,n===null?Zu=i:n.next=i,i===null&&(Qu=n)):(n=r,(e!==0||a&3)&&(ed=!0)),r=i}iu!==0&&iu!==5||id(e,!1),nd!==0&&(nd=0)}function sd(e,t){for(var n=e.suspendedLanes,r=e.pingedLanes,i=e.expirationTimes,a=e.pendingLanes&-62914561;0<a;){var o=31-He(a),s=1<<o,c=i[o];c===-1?((s&n)===0||(s&r)!==0)&&(i[o]=Qe(s,t)):c<=t&&(e.expiredLanes|=s),a&=~s}if(t=K,n=J,n=Xe(e,e===t?n:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),r=e.callbackNode,n===0||e===t&&(Y===2||Y===9)||e.cancelPendingCommit!==null)return r!==null&&r!==null&&De(r),e.callbackNode=null,e.callbackPriority=0;if(!(n&3)||Ze(e,n)){if(t=n&-n,t===e.callbackPriority)return t;switch(r!==null&&De(r),st(n)){case 2:case 8:n=Ne;break;case 32:n=Pe;break;case 268435456:n=Ie;break;default:n=Pe}return r=cd.bind(null,e),n=Ee(n,r),e.callbackPriority=t,e.callbackNode=n,t}return r!==null&&r!==null&&De(r),e.callbackPriority=2,e.callbackNode=null,2}function cd(e,t){if(iu!==0&&iu!==5)return e.callbackNode=null,e.callbackPriority=0,null;var n=e.callbackNode;if(Hu()&&e.callbackNode!==n)return null;var r=J;return r=Xe(e,e===K?r:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),r===0?null:(gu(e,r,t),sd(e,Ae()),e.callbackNode!=null&&e.callbackNode===n?cd.bind(null,e):null)}function ld(e,t){if(Hu())return null;gu(e,t,!0)}function ud(){Yd(function(){G&6?Ee(Me,ad):od()})}function dd(){if(nd===0){var e=fa;e===0&&(e=Ke,Ke<<=1,!(Ke&261888)&&(Ke=256)),nd=e}return nd}function fd(e){return e==null||typeof e==`symbol`||typeof e==`boolean`?null:typeof e==`function`?e:$t(``+e)}function pd(e,t){var n=t.ownerDocument.createElement(`input`);return n.name=t.name,n.value=t.value,e.id&&n.setAttribute(`form`,e.id),t.parentNode.insertBefore(n,t),e=new FormData(e),n.parentNode.removeChild(n),e}function md(e,t,n,r,i){if(t===`submit`&&n&&n.stateNode===i){var a=fd((i[ft]||null).action),o=r.submitter;o&&(t=(t=o[ft]||null)?fd(t.formAction):o.getAttribute(`formAction`),t!==null&&(a=t,o=null));var s=new Sn(`action`,`action`,null,r,i);e.push({event:s,listeners:[{instance:null,listener:function(){if(r.defaultPrevented){if(nd!==0){var e=o?pd(i,o):new FormData(i);Ts(n,{pending:!0,data:e,method:i.method,action:a},null,e)}}else typeof a==`function`&&(s.preventDefault(),e=o?pd(i,o):new FormData(i),Ts(n,{pending:!0,data:e,method:i.method,action:a},a,e))},currentTarget:i}]})}}for(var hd=0;hd<Yr.length;hd++){var gd=Yr[hd];Xr(gd.toLowerCase(),`on`+(gd[0].toUpperCase()+gd.slice(1)))}Xr(Vr,`onAnimationEnd`),Xr(Hr,`onAnimationIteration`),Xr(Ur,`onAnimationStart`),Xr(`dblclick`,`onDoubleClick`),Xr(`focusin`,`onFocus`),Xr(`focusout`,`onBlur`),Xr(Wr,`onTransitionRun`),Xr(Gr,`onTransitionStart`),Xr(Kr,`onTransitionCancel`),Xr(qr,`onTransitionEnd`),Ot(`onMouseEnter`,[`mouseout`,`mouseover`]),Ot(`onMouseLeave`,[`mouseout`,`mouseover`]),Ot(`onPointerEnter`,[`pointerout`,`pointerover`]),Ot(`onPointerLeave`,[`pointerout`,`pointerover`]),Dt(`onChange`,`change click focusin focusout input keydown keyup selectionchange`.split(` `)),Dt(`onSelect`,`focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange`.split(` `)),Dt(`onBeforeInput`,[`compositionend`,`keypress`,`textInput`,`paste`]),Dt(`onCompositionEnd`,`compositionend focusout keydown keypress keyup mousedown`.split(` `)),Dt(`onCompositionStart`,`compositionstart focusout keydown keypress keyup mousedown`.split(` `)),Dt(`onCompositionUpdate`,`compositionupdate focusout keydown keypress keyup mousedown`.split(` `));var _d=`abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting`.split(` `),vd=new Set(`beforetoggle cancel close invalid load scroll scrollend toggle`.split(` `).concat(_d));function yd(e,t){t=(t&4)!=0;for(var n=0;n<e.length;n++){var r=e[n],i=r.event;r=r.listeners;a:{var a=void 0;if(t)for(var o=r.length-1;0<=o;o--){var s=r[o],c=s.instance,l=s.currentTarget;if(s=s.listener,c!==a&&i.isPropagationStopped())break a;a=s,i.currentTarget=l;try{a(i)}catch(e){Zr(e)}i.currentTarget=null,a=c}else for(o=0;o<r.length;o++){if(s=r[o],c=s.instance,l=s.currentTarget,s=s.listener,c!==a&&i.isPropagationStopped())break a;a=s,i.currentTarget=l;try{a(i)}catch(e){Zr(e)}i.currentTarget=null,a=c}}}}function Q(e,t){var n=t[mt];n===void 0&&(n=t[mt]=new Set);var r=e+`__bubble`;n.has(r)||(Cd(t,e,2,!1),n.add(r))}function bd(e,t,n){var r=0;t&&(r|=4),Cd(n,e,r,t)}var xd=`_reactListening`+Math.random().toString(36).slice(2);function Sd(e){if(!e[xd]){e[xd]=!0,Tt.forEach(function(t){t!==`selectionchange`&&(vd.has(t)||bd(t,!1,e),bd(t,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[xd]||(t[xd]=!0,bd(`selectionchange`,!1,t))}}function Cd(e,t,n,r){switch(mp(t)){case 2:var i=cp;break;case 8:i=lp;break;default:i=up}n=i.bind(null,t,n,e),i=void 0,!dn||t!==`touchstart`&&t!==`touchmove`&&t!==`wheel`||(i=!0),r?i===void 0?e.addEventListener(t,n,!0):e.addEventListener(t,n,{capture:!0,passive:i}):i===void 0?e.addEventListener(t,n,!1):e.addEventListener(t,n,{passive:i})}function wd(e,t,n,r,i){var a=r;if(!(t&1)&&!(t&2)&&r!==null)a:for(;;){if(r===null)return;var s=r.tag;if(s===3||s===4){var c=r.stateNode.containerInfo;if(c===i)break;if(s===4)for(s=r.return;s!==null;){var l=s.tag;if((l===3||l===4)&&s.stateNode.containerInfo===i)return;s=s.return}for(;c!==null;){if(s=bt(c),s===null)return;if(l=s.tag,l===5||l===6||l===26||l===27){r=a=s;continue a}c=c.parentNode}}r=r.return}cn(function(){var r=a,i=nn(n),s=[];a:{var c=Jr.get(e);if(c!==void 0){var l=Sn,u=e;switch(e){case`keypress`:if(_n(n)===0)break a;case`keydown`:case`keyup`:l=Bn;break;case`focusin`:u=`focus`,l=jn;break;case`focusout`:u=`blur`,l=jn;break;case`beforeblur`:case`afterblur`:l=jn;break;case`click`:if(n.button===2)break a;case`auxclick`:case`dblclick`:case`mousedown`:case`mousemove`:case`mouseup`:case`mouseout`:case`mouseover`:case`contextmenu`:l=kn;break;case`drag`:case`dragend`:case`dragenter`:case`dragexit`:case`dragleave`:case`dragover`:case`dragstart`:case`drop`:l=An;break;case`touchcancel`:case`touchend`:case`touchmove`:case`touchstart`:l=Hn;break;case Vr:case Hr:case Ur:l=Mn;break;case qr:l=Un;break;case`scroll`:case`scrollend`:l=wn;break;case`wheel`:l=Wn;break;case`copy`:case`cut`:case`paste`:l=Nn;break;case`gotpointercapture`:case`lostpointercapture`:case`pointercancel`:case`pointerdown`:case`pointermove`:case`pointerout`:case`pointerover`:case`pointerup`:l=Vn;break;case`toggle`:case`beforetoggle`:l=Gn}var d=(t&4)!=0,f=!d&&(e===`scroll`||e===`scrollend`),p=d?c===null?null:c+`Capture`:c;d=[];for(var m=r,h;m!==null;){var g=m;if(h=g.stateNode,g=g.tag,g!==5&&g!==26&&g!==27||h===null||p===null||(g=ln(m,p),g!=null&&d.push(Td(m,g,h))),f)break;m=m.return}0<d.length&&(c=new l(c,u,null,n,i),s.push({event:c,listeners:d}))}}if(!(t&7)){a:{if(c=e===`mouseover`||e===`pointerover`,l=e===`mouseout`||e===`pointerout`,c&&n!==tn&&(u=n.relatedTarget||n.fromElement)&&(bt(u)||u[pt]))break a;if((l||c)&&(c=i.window===i?i:(c=i.ownerDocument)?c.defaultView||c.parentWindow:window,l?(u=n.relatedTarget||n.toElement,l=r,u=u?bt(u):null,u!==null&&(f=o(u),d=u.tag,u!==f||d!==5&&d!==27&&d!==6)&&(u=null)):(l=null,u=r),l!==u)){if(d=kn,g=`onMouseLeave`,p=`onMouseEnter`,m=`mouse`,(e===`pointerout`||e===`pointerover`)&&(d=Vn,g=`onPointerLeave`,p=`onPointerEnter`,m=`pointer`),f=l==null?c:St(l),h=u==null?c:St(u),c=new d(g,m+`leave`,l,n,i),c.target=f,c.relatedTarget=h,g=null,bt(i)===r&&(d=new d(p,m+`enter`,u,n,i),d.target=h,d.relatedTarget=f,g=d),f=g,l&&u)b:{for(d=Dd,p=l,m=u,h=0,g=p;g;g=d(g))h++;g=0;for(var _=m;_;_=d(_))g++;for(;0<h-g;)p=d(p),h--;for(;0<g-h;)m=d(m),g--;for(;h--;){if(p===m||m!==null&&p===m.alternate){d=p;break b}p=d(p),m=d(m)}d=null}else d=null;l!==null&&Od(s,c,l,d,!1),u!==null&&f!==null&&Od(s,f,u,d,!0)}}a:{if(c=r?St(r):window,l=c.nodeName&&c.nodeName.toLowerCase(),l===`select`||l===`input`&&c.type===`file`)var v=dr;else if(ar(c))if(fr)v=xr;else{v=yr;var y=vr}else l=c.nodeName,!l||l.toLowerCase()!==`input`||c.type!==`checkbox`&&c.type!==`radio`?r&&Zt(r.elementType)&&(v=dr):v=br;if(v&&=v(e,r)){or(s,v,n,i);break a}y&&y(e,c,r),e===`focusout`&&r&&c.type===`number`&&r.memoizedProps.value!=null&&Kt(c,`number`,c.value)}switch(y=r?St(r):window,e){case`focusin`:(ar(y)||y.contentEditable===`true`)&&(jr=y,Mr=r,Nr=null);break;case`focusout`:Nr=Mr=jr=null;break;case`mousedown`:Pr=!0;break;case`contextmenu`:case`mouseup`:case`dragend`:Pr=!1,Fr(s,n,i);break;case`selectionchange`:if(Ar)break;case`keydown`:case`keyup`:Fr(s,n,i)}var b;if(qn)b:{switch(e){case`compositionstart`:var x=`onCompositionStart`;break b;case`compositionend`:x=`onCompositionEnd`;break b;case`compositionupdate`:x=`onCompositionUpdate`;break b}x=void 0}else tr?$n(e,n)&&(x=`onCompositionEnd`):e===`keydown`&&n.keyCode===229&&(x=`onCompositionStart`);x&&(Xn&&n.locale!==`ko`&&(tr||x!==`onCompositionStart`?x===`onCompositionEnd`&&tr&&(b=gn()):(pn=i,mn=`value`in pn?pn.value:pn.textContent,tr=!0)),y=Ed(r,x),0<y.length&&(x=new Pn(x,e,null,n,i),s.push({event:x,listeners:y}),b?x.data=b:(b=er(n),b!==null&&(x.data=b)))),(b=Yn?nr(e,n):rr(e,n))&&(x=Ed(r,`onBeforeInput`),0<x.length&&(y=new Pn(`onBeforeInput`,`beforeinput`,null,n,i),s.push({event:y,listeners:x}),y.data=b)),md(s,e,r,n,i)}yd(s,t)})}function Td(e,t,n){return{instance:e,listener:t,currentTarget:n}}function Ed(e,t){for(var n=t+`Capture`,r=[];e!==null;){var i=e,a=i.stateNode;if(i=i.tag,i!==5&&i!==26&&i!==27||a===null||(i=ln(e,n),i!=null&&r.unshift(Td(e,i,a)),i=ln(e,t),i!=null&&r.push(Td(e,i,a))),e.tag===3)return r;e=e.return}return[]}function Dd(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function Od(e,t,n,r,i){for(var a=t._reactName,o=[];n!==null&&n!==r;){var s=n,c=s.alternate,l=s.stateNode;if(s=s.tag,c!==null&&c===r)break;s!==5&&s!==26&&s!==27||l===null||(c=l,i?(l=ln(n,a),l!=null&&o.unshift(Td(n,l,c))):i||(l=ln(n,a),l!=null&&o.push(Td(n,l,c)))),n=n.return}o.length!==0&&e.push({event:t,listeners:o})}var kd=/\r\n?/g,Ad=/\u0000|\uFFFD/g;function jd(e){return(typeof e==`string`?e:``+e).replace(kd,`
`).replace(Ad,``)}function Md(e,t){return t=jd(t),jd(e)===t}function $(e,t,n,r,a,o){switch(n){case`children`:typeof r==`string`?t===`body`||t===`textarea`&&r===``||I(e,r):(typeof r==`number`||typeof r==`bigint`)&&t!==`body`&&I(e,``+r);break;case`className`:Pt(e,`class`,r);break;case`tabIndex`:Pt(e,`tabindex`,r);break;case`dir`:case`role`:case`viewBox`:case`width`:case`height`:Pt(e,n,r);break;case`style`:Xt(e,r,o);break;case`data`:if(t!==`object`){Pt(e,`data`,r);break}case`src`:case`href`:if(r===``&&(t!==`a`||n!==`href`)){e.removeAttribute(n);break}if(r==null||typeof r==`function`||typeof r==`symbol`||typeof r==`boolean`){e.removeAttribute(n);break}r=$t(``+r),e.setAttribute(n,r);break;case`action`:case`formAction`:if(typeof r==`function`){e.setAttribute(n,`javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')`);break}else typeof o==`function`&&(n===`formAction`?(t!==`input`&&$(e,t,`name`,a.name,a,null),$(e,t,`formEncType`,a.formEncType,a,null),$(e,t,`formMethod`,a.formMethod,a,null),$(e,t,`formTarget`,a.formTarget,a,null)):($(e,t,`encType`,a.encType,a,null),$(e,t,`method`,a.method,a,null),$(e,t,`target`,a.target,a,null)));if(r==null||typeof r==`symbol`||typeof r==`boolean`){e.removeAttribute(n);break}r=$t(``+r),e.setAttribute(n,r);break;case`onClick`:r!=null&&(e.onclick=en);break;case`onScroll`:r!=null&&Q(`scroll`,e);break;case`onScrollEnd`:r!=null&&Q(`scrollend`,e);break;case`dangerouslySetInnerHTML`:if(r!=null){if(typeof r!=`object`||!(`__html`in r))throw Error(i(61));if(n=r.__html,n!=null){if(a.children!=null)throw Error(i(60));e.innerHTML=n}}break;case`multiple`:e.multiple=r&&typeof r!=`function`&&typeof r!=`symbol`;break;case`muted`:e.muted=r&&typeof r!=`function`&&typeof r!=`symbol`;break;case`suppressContentEditableWarning`:case`suppressHydrationWarning`:case`defaultValue`:case`defaultChecked`:case`innerHTML`:case`ref`:break;case`autoFocus`:break;case`xlinkHref`:if(r==null||typeof r==`function`||typeof r==`boolean`||typeof r==`symbol`){e.removeAttribute(`xlink:href`);break}n=$t(``+r),e.setAttributeNS(`http://www.w3.org/1999/xlink`,`xlink:href`,n);break;case`contentEditable`:case`spellCheck`:case`draggable`:case`value`:case`autoReverse`:case`externalResourcesRequired`:case`focusable`:case`preserveAlpha`:r!=null&&typeof r!=`function`&&typeof r!=`symbol`?e.setAttribute(n,``+r):e.removeAttribute(n);break;case`inert`:case`allowFullScreen`:case`async`:case`autoPlay`:case`controls`:case`default`:case`defer`:case`disabled`:case`disablePictureInPicture`:case`disableRemotePlayback`:case`formNoValidate`:case`hidden`:case`loop`:case`noModule`:case`noValidate`:case`open`:case`playsInline`:case`readOnly`:case`required`:case`reversed`:case`scoped`:case`seamless`:case`itemScope`:r&&typeof r!=`function`&&typeof r!=`symbol`?e.setAttribute(n,``):e.removeAttribute(n);break;case`capture`:case`download`:!0===r?e.setAttribute(n,``):!1!==r&&r!=null&&typeof r!=`function`&&typeof r!=`symbol`?e.setAttribute(n,r):e.removeAttribute(n);break;case`cols`:case`rows`:case`size`:case`span`:r!=null&&typeof r!=`function`&&typeof r!=`symbol`&&!isNaN(r)&&1<=r?e.setAttribute(n,r):e.removeAttribute(n);break;case`rowSpan`:case`start`:r==null||typeof r==`function`||typeof r==`symbol`||isNaN(r)?e.removeAttribute(n):e.setAttribute(n,r);break;case`popover`:Q(`beforetoggle`,e),Q(`toggle`,e),Nt(e,`popover`,r);break;case`xlinkActuate`:Ft(e,`http://www.w3.org/1999/xlink`,`xlink:actuate`,r);break;case`xlinkArcrole`:Ft(e,`http://www.w3.org/1999/xlink`,`xlink:arcrole`,r);break;case`xlinkRole`:Ft(e,`http://www.w3.org/1999/xlink`,`xlink:role`,r);break;case`xlinkShow`:Ft(e,`http://www.w3.org/1999/xlink`,`xlink:show`,r);break;case`xlinkTitle`:Ft(e,`http://www.w3.org/1999/xlink`,`xlink:title`,r);break;case`xlinkType`:Ft(e,`http://www.w3.org/1999/xlink`,`xlink:type`,r);break;case`xmlBase`:Ft(e,`http://www.w3.org/XML/1998/namespace`,`xml:base`,r);break;case`xmlLang`:Ft(e,`http://www.w3.org/XML/1998/namespace`,`xml:lang`,r);break;case`xmlSpace`:Ft(e,`http://www.w3.org/XML/1998/namespace`,`xml:space`,r);break;case`is`:Nt(e,`is`,r);break;case`innerText`:case`textContent`:break;default:(!(2<n.length)||n[0]!==`o`&&n[0]!==`O`||n[1]!==`n`&&n[1]!==`N`)&&(n=L.get(n)||n,Nt(e,n,r))}}function Nd(e,t,n,r,a,o){switch(n){case`style`:Xt(e,r,o);break;case`dangerouslySetInnerHTML`:if(r!=null){if(typeof r!=`object`||!(`__html`in r))throw Error(i(61));if(n=r.__html,n!=null){if(a.children!=null)throw Error(i(60));e.innerHTML=n}}break;case`children`:typeof r==`string`?I(e,r):(typeof r==`number`||typeof r==`bigint`)&&I(e,``+r);break;case`onScroll`:r!=null&&Q(`scroll`,e);break;case`onScrollEnd`:r!=null&&Q(`scrollend`,e);break;case`onClick`:r!=null&&(e.onclick=en);break;case`suppressContentEditableWarning`:case`suppressHydrationWarning`:case`innerHTML`:case`ref`:break;case`innerText`:case`textContent`:break;default:if(!Et.hasOwnProperty(n))a:{if(n[0]===`o`&&n[1]===`n`&&(a=n.endsWith(`Capture`),t=n.slice(2,a?n.length-7:void 0),o=e[ft]||null,o=o==null?null:o[n],typeof o==`function`&&e.removeEventListener(t,o,a),typeof r==`function`)){typeof o!=`function`&&o!==null&&(n in e?e[n]=null:e.hasAttribute(n)&&e.removeAttribute(n)),e.addEventListener(t,r,a);break a}n in e?e[n]=r:!0===r?e.setAttribute(n,``):Nt(e,n,r)}}}function Pd(e,t,n){switch(t){case`div`:case`span`:case`svg`:case`path`:case`a`:case`g`:case`p`:case`li`:break;case`img`:Q(`error`,e),Q(`load`,e);var r=!1,a=!1,o;for(o in n)if(n.hasOwnProperty(o)){var s=n[o];if(s!=null)switch(o){case`src`:r=!0;break;case`srcSet`:a=!0;break;case`children`:case`dangerouslySetInnerHTML`:throw Error(i(137,t));default:$(e,t,o,s,n,null)}}a&&$(e,t,`srcSet`,n.srcSet,n,null),r&&$(e,t,`src`,n.src,n,null);return;case`input`:Q(`invalid`,e);var c=o=s=a=null,l=null,u=null;for(r in n)if(n.hasOwnProperty(r)){var d=n[r];if(d!=null)switch(r){case`name`:a=d;break;case`type`:s=d;break;case`checked`:l=d;break;case`defaultChecked`:u=d;break;case`value`:o=d;break;case`defaultValue`:c=d;break;case`children`:case`dangerouslySetInnerHTML`:if(d!=null)throw Error(i(137,t));break;default:$(e,t,r,d,n,null)}}Gt(e,o,c,l,u,s,a,!1);return;case`select`:for(a in Q(`invalid`,e),r=s=o=null,n)if(n.hasOwnProperty(a)&&(c=n[a],c!=null))switch(a){case`value`:o=c;break;case`defaultValue`:s=c;break;case`multiple`:r=c;default:$(e,t,a,c,n,null)}t=o,n=s,e.multiple=!!r,t==null?n!=null&&qt(e,!!r,n,!0):qt(e,!!r,t,!1);return;case`textarea`:for(s in Q(`invalid`,e),o=a=r=null,n)if(n.hasOwnProperty(s)&&(c=n[s],c!=null))switch(s){case`value`:r=c;break;case`defaultValue`:a=c;break;case`children`:o=c;break;case`dangerouslySetInnerHTML`:if(c!=null)throw Error(i(91));break;default:$(e,t,s,c,n,null)}F(e,r,a,o);return;case`option`:for(l in n)if(n.hasOwnProperty(l)&&(r=n[l],r!=null))switch(l){case`selected`:e.selected=r&&typeof r!=`function`&&typeof r!=`symbol`;break;default:$(e,t,l,r,n,null)}return;case`dialog`:Q(`beforetoggle`,e),Q(`toggle`,e),Q(`cancel`,e),Q(`close`,e);break;case`iframe`:case`object`:Q(`load`,e);break;case`video`:case`audio`:for(r=0;r<_d.length;r++)Q(_d[r],e);break;case`image`:Q(`error`,e),Q(`load`,e);break;case`details`:Q(`toggle`,e);break;case`embed`:case`source`:case`link`:Q(`error`,e),Q(`load`,e);case`area`:case`base`:case`br`:case`col`:case`hr`:case`keygen`:case`meta`:case`param`:case`track`:case`wbr`:case`menuitem`:for(u in n)if(n.hasOwnProperty(u)&&(r=n[u],r!=null))switch(u){case`children`:case`dangerouslySetInnerHTML`:throw Error(i(137,t));default:$(e,t,u,r,n,null)}return;default:if(Zt(t)){for(d in n)n.hasOwnProperty(d)&&(r=n[d],r!==void 0&&Nd(e,t,d,r,n,void 0));return}}for(c in n)n.hasOwnProperty(c)&&(r=n[c],r!=null&&$(e,t,c,r,n,null))}function Fd(e,t,n,r){switch(t){case`div`:case`span`:case`svg`:case`path`:case`a`:case`g`:case`p`:case`li`:break;case`input`:var a=null,o=null,s=null,c=null,l=null,u=null,d=null;for(m in n){var f=n[m];if(n.hasOwnProperty(m)&&f!=null)switch(m){case`checked`:break;case`value`:break;case`defaultValue`:l=f;default:r.hasOwnProperty(m)||$(e,t,m,null,r,f)}}for(var p in r){var m=r[p];if(f=n[p],r.hasOwnProperty(p)&&(m!=null||f!=null))switch(p){case`type`:o=m;break;case`name`:a=m;break;case`checked`:u=m;break;case`defaultChecked`:d=m;break;case`value`:s=m;break;case`defaultValue`:c=m;break;case`children`:case`dangerouslySetInnerHTML`:if(m!=null)throw Error(i(137,t));break;default:m!==f&&$(e,t,p,m,r,f)}}Wt(e,s,c,l,u,d,o,a);return;case`select`:for(o in m=s=c=p=null,n)if(l=n[o],n.hasOwnProperty(o)&&l!=null)switch(o){case`value`:break;case`multiple`:m=l;default:r.hasOwnProperty(o)||$(e,t,o,null,r,l)}for(a in r)if(o=r[a],l=n[a],r.hasOwnProperty(a)&&(o!=null||l!=null))switch(a){case`value`:p=o;break;case`defaultValue`:c=o;break;case`multiple`:s=o;default:o!==l&&$(e,t,a,o,r,l)}t=c,n=s,r=m,p==null?!!r!=!!n&&(t==null?qt(e,!!n,n?[]:``,!1):qt(e,!!n,t,!0)):qt(e,!!n,p,!1);return;case`textarea`:for(c in m=p=null,n)if(a=n[c],n.hasOwnProperty(c)&&a!=null&&!r.hasOwnProperty(c))switch(c){case`value`:break;case`children`:break;default:$(e,t,c,null,r,a)}for(s in r)if(a=r[s],o=n[s],r.hasOwnProperty(s)&&(a!=null||o!=null))switch(s){case`value`:p=a;break;case`defaultValue`:m=a;break;case`children`:break;case`dangerouslySetInnerHTML`:if(a!=null)throw Error(i(91));break;default:a!==o&&$(e,t,s,a,r,o)}P(e,p,m);return;case`option`:for(var h in n)if(p=n[h],n.hasOwnProperty(h)&&p!=null&&!r.hasOwnProperty(h))switch(h){case`selected`:e.selected=!1;break;default:$(e,t,h,null,r,p)}for(l in r)if(p=r[l],m=n[l],r.hasOwnProperty(l)&&p!==m&&(p!=null||m!=null))switch(l){case`selected`:e.selected=p&&typeof p!=`function`&&typeof p!=`symbol`;break;default:$(e,t,l,p,r,m)}return;case`img`:case`link`:case`area`:case`base`:case`br`:case`col`:case`embed`:case`hr`:case`keygen`:case`meta`:case`param`:case`source`:case`track`:case`wbr`:case`menuitem`:for(var g in n)p=n[g],n.hasOwnProperty(g)&&p!=null&&!r.hasOwnProperty(g)&&$(e,t,g,null,r,p);for(u in r)if(p=r[u],m=n[u],r.hasOwnProperty(u)&&p!==m&&(p!=null||m!=null))switch(u){case`children`:case`dangerouslySetInnerHTML`:if(p!=null)throw Error(i(137,t));break;default:$(e,t,u,p,r,m)}return;default:if(Zt(t)){for(var _ in n)p=n[_],n.hasOwnProperty(_)&&p!==void 0&&!r.hasOwnProperty(_)&&Nd(e,t,_,void 0,r,p);for(d in r)p=r[d],m=n[d],!r.hasOwnProperty(d)||p===m||p===void 0&&m===void 0||Nd(e,t,d,p,r,m);return}}for(var v in n)p=n[v],n.hasOwnProperty(v)&&p!=null&&!r.hasOwnProperty(v)&&$(e,t,v,null,r,p);for(f in r)p=r[f],m=n[f],!r.hasOwnProperty(f)||p===m||p==null&&m==null||$(e,t,f,p,r,m)}function Id(e){switch(e){case`css`:case`script`:case`font`:case`img`:case`image`:case`input`:case`link`:return!0;default:return!1}}function Ld(){if(typeof performance.getEntriesByType==`function`){for(var e=0,t=0,n=performance.getEntriesByType(`resource`),r=0;r<n.length;r++){var i=n[r],a=i.transferSize,o=i.initiatorType,s=i.duration;if(a&&s&&Id(o)){for(o=0,s=i.responseEnd,r+=1;r<n.length;r++){var c=n[r],l=c.startTime;if(l>s)break;var u=c.transferSize,d=c.initiatorType;u&&Id(d)&&(c=c.responseEnd,o+=u*(c<s?1:(s-l)/(c-l)))}if(--r,t+=8*(a+o)/(i.duration/1e3),e++,10<e)break}}if(0<e)return t/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e==`number`)?e:5}var Rd=null,zd=null;function Bd(e){return e.nodeType===9?e:e.ownerDocument}function Vd(e){switch(e){case`http://www.w3.org/2000/svg`:return 1;case`http://www.w3.org/1998/Math/MathML`:return 2;default:return 0}}function Hd(e,t){if(e===0)switch(t){case`svg`:return 1;case`math`:return 2;default:return 0}return e===1&&t===`foreignObject`?0:e}function Ud(e,t){return e===`textarea`||e===`noscript`||typeof t.children==`string`||typeof t.children==`number`||typeof t.children==`bigint`||typeof t.dangerouslySetInnerHTML==`object`&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Wd=null;function Gd(){var e=window.event;return e&&e.type===`popstate`?e===Wd?!1:(Wd=e,!0):(Wd=null,!1)}var Kd=typeof setTimeout==`function`?setTimeout:void 0,qd=typeof clearTimeout==`function`?clearTimeout:void 0,Jd=typeof Promise==`function`?Promise:void 0,Yd=typeof queueMicrotask==`function`?queueMicrotask:Jd===void 0?Kd:function(e){return Jd.resolve(null).then(e).catch(Xd)};function Xd(e){setTimeout(function(){throw e})}function Zd(e){return e===`head`}function Qd(e,t){var n=t,r=0;do{var i=n.nextSibling;if(e.removeChild(n),i&&i.nodeType===8)if(n=i.data,n===`/$`||n===`/&`){if(r===0){e.removeChild(i),Np(t);return}r--}else if(n===`$`||n===`$?`||n===`$~`||n===`$!`||n===`&`)r++;else if(n===`html`)pf(e.ownerDocument.documentElement);else if(n===`head`){n=e.ownerDocument.head,pf(n);for(var a=n.firstChild;a;){var o=a.nextSibling,s=a.nodeName;a[vt]||s===`SCRIPT`||s===`STYLE`||s===`LINK`&&a.rel.toLowerCase()===`stylesheet`||n.removeChild(a),a=o}}else n===`body`&&pf(e.ownerDocument.body);n=i}while(n);Np(t)}function $d(e,t){var n=e;e=0;do{var r=n.nextSibling;if(n.nodeType===1?t?(n._stashedDisplay=n.style.display,n.style.display=`none`):(n.style.display=n._stashedDisplay||``,n.getAttribute(`style`)===``&&n.removeAttribute(`style`)):n.nodeType===3&&(t?(n._stashedText=n.nodeValue,n.nodeValue=``):n.nodeValue=n._stashedText||``),r&&r.nodeType===8)if(n=r.data,n===`/$`){if(e===0)break;e--}else n!==`$`&&n!==`$?`&&n!==`$~`&&n!==`$!`||e++;n=r}while(n)}function ef(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var n=t;switch(t=t.nextSibling,n.nodeName){case`HTML`:case`HEAD`:case`BODY`:ef(n),yt(n);continue;case`SCRIPT`:case`STYLE`:continue;case`LINK`:if(n.rel.toLowerCase()===`stylesheet`)continue}e.removeChild(n)}}function tf(e,t,n,r){for(;e.nodeType===1;){var i=n;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!r&&(e.nodeName!==`INPUT`||e.type!==`hidden`))break}else if(!r)if(t===`input`&&e.type===`hidden`){var a=i.name==null?null:``+i.name;if(i.type===`hidden`&&e.getAttribute(`name`)===a)return e}else return e;else if(!e[vt])switch(t){case`meta`:if(!e.hasAttribute(`itemprop`))break;return e;case`link`:if(a=e.getAttribute(`rel`),a===`stylesheet`&&e.hasAttribute(`data-precedence`)||a!==i.rel||e.getAttribute(`href`)!==(i.href==null||i.href===``?null:i.href)||e.getAttribute(`crossorigin`)!==(i.crossOrigin==null?null:i.crossOrigin)||e.getAttribute(`title`)!==(i.title==null?null:i.title))break;return e;case`style`:if(e.hasAttribute(`data-precedence`))break;return e;case`script`:if(a=e.getAttribute(`src`),(a!==(i.src==null?null:i.src)||e.getAttribute(`type`)!==(i.type==null?null:i.type)||e.getAttribute(`crossorigin`)!==(i.crossOrigin==null?null:i.crossOrigin))&&a&&e.hasAttribute(`async`)&&!e.hasAttribute(`itemprop`))break;return e;default:return e}if(e=cf(e.nextSibling),e===null)break}return null}function nf(e,t,n){if(t===``)return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!==`INPUT`||e.type!==`hidden`)&&!n||(e=cf(e.nextSibling),e===null))return null;return e}function rf(e,t){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!==`INPUT`||e.type!==`hidden`)&&!t||(e=cf(e.nextSibling),e===null))return null;return e}function af(e){return e.data===`$?`||e.data===`$~`}function of(e){return e.data===`$!`||e.data===`$?`&&e.ownerDocument.readyState!==`loading`}function sf(e,t){var n=e.ownerDocument;if(e.data===`$~`)e._reactRetry=t;else if(e.data!==`$?`||n.readyState!==`loading`)t();else{var r=function(){t(),n.removeEventListener(`DOMContentLoaded`,r)};n.addEventListener(`DOMContentLoaded`,r),e._reactRetry=r}}function cf(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t===`$`||t===`$!`||t===`$?`||t===`$~`||t===`&`||t===`F!`||t===`F`)break;if(t===`/$`||t===`/&`)return null}}return e}var lf=null;function uf(e){e=e.nextSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n===`/$`||n===`/&`){if(t===0)return cf(e.nextSibling);t--}else n!==`$`&&n!==`$!`&&n!==`$?`&&n!==`$~`&&n!==`&`||t++}e=e.nextSibling}return null}function df(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n===`$`||n===`$!`||n===`$?`||n===`$~`||n===`&`){if(t===0)return e;t--}else n!==`/$`&&n!==`/&`||t++}e=e.previousSibling}return null}function ff(e,t,n){switch(t=Bd(n),e){case`html`:if(e=t.documentElement,!e)throw Error(i(452));return e;case`head`:if(e=t.head,!e)throw Error(i(453));return e;case`body`:if(e=t.body,!e)throw Error(i(454));return e;default:throw Error(i(451))}}function pf(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);yt(e)}var mf=new Map,hf=new Set;function gf(e){return typeof e.getRootNode==`function`?e.getRootNode():e.nodeType===9?e:e.ownerDocument}var _f=k.d;k.d={f:vf,r:yf,D:Sf,C:Cf,L:wf,m:Tf,X:Df,S:Ef,M:Of};function vf(){var e=_f.f(),t=bu();return e||t}function yf(e){var t=xt(e);t!==null&&t.tag===5&&t.type===`form`?Ds(t):_f.r(e)}var bf=typeof document>`u`?null:document;function xf(e,t,n){var r=bf;if(r&&typeof t==`string`&&t){var i=Ut(t);i=`link[rel="`+e+`"][href="`+i+`"]`,typeof n==`string`&&(i+=`[crossorigin="`+n+`"]`),hf.has(i)||(hf.add(i),e={rel:e,crossOrigin:n,href:t},r.querySelector(i)===null&&(t=r.createElement(`link`),Pd(t,`link`,e),wt(t),r.head.appendChild(t)))}}function Sf(e){_f.D(e),xf(`dns-prefetch`,e,null)}function Cf(e,t){_f.C(e,t),xf(`preconnect`,e,t)}function wf(e,t,n){_f.L(e,t,n);var r=bf;if(r&&e&&t){var i=`link[rel="preload"][as="`+Ut(t)+`"]`;t===`image`&&n&&n.imageSrcSet?(i+=`[imagesrcset="`+Ut(n.imageSrcSet)+`"]`,typeof n.imageSizes==`string`&&(i+=`[imagesizes="`+Ut(n.imageSizes)+`"]`)):i+=`[href="`+Ut(e)+`"]`;var a=i;switch(t){case`style`:a=Af(e);break;case`script`:a=Pf(e)}mf.has(a)||(e=m({rel:`preload`,href:t===`image`&&n&&n.imageSrcSet?void 0:e,as:t},n),mf.set(a,e),r.querySelector(i)!==null||t===`style`&&r.querySelector(jf(a))||t===`script`&&r.querySelector(Ff(a))||(t=r.createElement(`link`),Pd(t,`link`,e),wt(t),r.head.appendChild(t)))}}function Tf(e,t){_f.m(e,t);var n=bf;if(n&&e){var r=t&&typeof t.as==`string`?t.as:`script`,i=`link[rel="modulepreload"][as="`+Ut(r)+`"][href="`+Ut(e)+`"]`,a=i;switch(r){case`audioworklet`:case`paintworklet`:case`serviceworker`:case`sharedworker`:case`worker`:case`script`:a=Pf(e)}if(!mf.has(a)&&(e=m({rel:`modulepreload`,href:e},t),mf.set(a,e),n.querySelector(i)===null)){switch(r){case`audioworklet`:case`paintworklet`:case`serviceworker`:case`sharedworker`:case`worker`:case`script`:if(n.querySelector(Ff(a)))return}r=n.createElement(`link`),Pd(r,`link`,e),wt(r),n.head.appendChild(r)}}}function Ef(e,t,n){_f.S(e,t,n);var r=bf;if(r&&e){var i=Ct(r).hoistableStyles,a=Af(e);t||=`default`;var o=i.get(a);if(!o){var s={loading:0,preload:null};if(o=r.querySelector(jf(a)))s.loading=5;else{e=m({rel:`stylesheet`,href:e,"data-precedence":t},n),(n=mf.get(a))&&Rf(e,n);var c=o=r.createElement(`link`);wt(c),Pd(c,`link`,e),c._p=new Promise(function(e,t){c.onload=e,c.onerror=t}),c.addEventListener(`load`,function(){s.loading|=1}),c.addEventListener(`error`,function(){s.loading|=2}),s.loading|=4,Lf(o,t,r)}o={type:`stylesheet`,instance:o,count:1,state:s},i.set(a,o)}}}function Df(e,t){_f.X(e,t);var n=bf;if(n&&e){var r=Ct(n).hoistableScripts,i=Pf(e),a=r.get(i);a||(a=n.querySelector(Ff(i)),a||(e=m({src:e,async:!0},t),(t=mf.get(i))&&zf(e,t),a=n.createElement(`script`),wt(a),Pd(a,`link`,e),n.head.appendChild(a)),a={type:`script`,instance:a,count:1,state:null},r.set(i,a))}}function Of(e,t){_f.M(e,t);var n=bf;if(n&&e){var r=Ct(n).hoistableScripts,i=Pf(e),a=r.get(i);a||(a=n.querySelector(Ff(i)),a||(e=m({src:e,async:!0,type:`module`},t),(t=mf.get(i))&&zf(e,t),a=n.createElement(`script`),wt(a),Pd(a,`link`,e),n.head.appendChild(a)),a={type:`script`,instance:a,count:1,state:null},r.set(i,a))}}function kf(e,t,n,r){var a=(a=N.current)?gf(a):null;if(!a)throw Error(i(446));switch(e){case`meta`:case`title`:return null;case`style`:return typeof n.precedence==`string`&&typeof n.href==`string`?(t=Af(n.href),n=Ct(a).hoistableStyles,r=n.get(t),r||(r={type:`style`,instance:null,count:0,state:null},n.set(t,r)),r):{type:`void`,instance:null,count:0,state:null};case`link`:if(n.rel===`stylesheet`&&typeof n.href==`string`&&typeof n.precedence==`string`){e=Af(n.href);var o=Ct(a).hoistableStyles,s=o.get(e);if(s||(a=a.ownerDocument||a,s={type:`stylesheet`,instance:null,count:0,state:{loading:0,preload:null}},o.set(e,s),(o=a.querySelector(jf(e)))&&!o._p&&(s.instance=o,s.state.loading=5),mf.has(e)||(n={rel:`preload`,as:`style`,href:n.href,crossOrigin:n.crossOrigin,integrity:n.integrity,media:n.media,hrefLang:n.hrefLang,referrerPolicy:n.referrerPolicy},mf.set(e,n),o||Nf(a,e,n,s.state))),t&&r===null)throw Error(i(528,``));return s}if(t&&r!==null)throw Error(i(529,``));return null;case`script`:return t=n.async,n=n.src,typeof n==`string`&&t&&typeof t!=`function`&&typeof t!=`symbol`?(t=Pf(n),n=Ct(a).hoistableScripts,r=n.get(t),r||(r={type:`script`,instance:null,count:0,state:null},n.set(t,r)),r):{type:`void`,instance:null,count:0,state:null};default:throw Error(i(444,e))}}function Af(e){return`href="`+Ut(e)+`"`}function jf(e){return`link[rel="stylesheet"][`+e+`]`}function Mf(e){return m({},e,{"data-precedence":e.precedence,precedence:null})}function Nf(e,t,n,r){e.querySelector(`link[rel="preload"][as="style"][`+t+`]`)?r.loading=1:(t=e.createElement(`link`),r.preload=t,t.addEventListener(`load`,function(){return r.loading|=1}),t.addEventListener(`error`,function(){return r.loading|=2}),Pd(t,`link`,n),wt(t),e.head.appendChild(t))}function Pf(e){return`[src="`+Ut(e)+`"]`}function Ff(e){return`script[async]`+e}function If(e,t,n){if(t.count++,t.instance===null)switch(t.type){case`style`:var r=e.querySelector(`style[data-href~="`+Ut(n.href)+`"]`);if(r)return t.instance=r,wt(r),r;var a=m({},n,{"data-href":n.href,"data-precedence":n.precedence,href:null,precedence:null});return r=(e.ownerDocument||e).createElement(`style`),wt(r),Pd(r,`style`,a),Lf(r,n.precedence,e),t.instance=r;case`stylesheet`:a=Af(n.href);var o=e.querySelector(jf(a));if(o)return t.state.loading|=4,t.instance=o,wt(o),o;r=Mf(n),(a=mf.get(a))&&Rf(r,a),o=(e.ownerDocument||e).createElement(`link`),wt(o);var s=o;return s._p=new Promise(function(e,t){s.onload=e,s.onerror=t}),Pd(o,`link`,r),t.state.loading|=4,Lf(o,n.precedence,e),t.instance=o;case`script`:return o=Pf(n.src),(a=e.querySelector(Ff(o)))?(t.instance=a,wt(a),a):(r=n,(a=mf.get(o))&&(r=m({},n),zf(r,a)),e=e.ownerDocument||e,a=e.createElement(`script`),wt(a),Pd(a,`link`,r),e.head.appendChild(a),t.instance=a);case`void`:return null;default:throw Error(i(443,t.type))}else t.type===`stylesheet`&&!(t.state.loading&4)&&(r=t.instance,t.state.loading|=4,Lf(r,n.precedence,e));return t.instance}function Lf(e,t,n){for(var r=n.querySelectorAll(`link[rel="stylesheet"][data-precedence],style[data-precedence]`),i=r.length?r[r.length-1]:null,a=i,o=0;o<r.length;o++){var s=r[o];if(s.dataset.precedence===t)a=s;else if(a!==i)break}a?a.parentNode.insertBefore(e,a.nextSibling):(t=n.nodeType===9?n.head:n,t.insertBefore(e,t.firstChild))}function Rf(e,t){e.crossOrigin??=t.crossOrigin,e.referrerPolicy??=t.referrerPolicy,e.title??=t.title}function zf(e,t){e.crossOrigin??=t.crossOrigin,e.referrerPolicy??=t.referrerPolicy,e.integrity??=t.integrity}var Bf=null;function Vf(e,t,n){if(Bf===null){var r=new Map,i=Bf=new Map;i.set(n,r)}else i=Bf,r=i.get(n),r||(r=new Map,i.set(n,r));if(r.has(e))return r;for(r.set(e,null),n=n.getElementsByTagName(e),i=0;i<n.length;i++){var a=n[i];if(!(a[vt]||a[dt]||e===`link`&&a.getAttribute(`rel`)===`stylesheet`)&&a.namespaceURI!==`http://www.w3.org/2000/svg`){var o=a.getAttribute(t)||``;o=e+o;var s=r.get(o);s?s.push(a):r.set(o,[a])}}return r}function Hf(e,t,n){e=e.ownerDocument||e,e.head.insertBefore(n,t===`title`?e.querySelector(`head > title`):null)}function Uf(e,t,n){if(n===1||t.itemProp!=null)return!1;switch(e){case`meta`:case`title`:return!0;case`style`:if(typeof t.precedence!=`string`||typeof t.href!=`string`||t.href===``)break;return!0;case`link`:if(typeof t.rel!=`string`||typeof t.href!=`string`||t.href===``||t.onLoad||t.onError)break;switch(t.rel){case`stylesheet`:return e=t.disabled,typeof t.precedence==`string`&&e==null;default:return!0}case`script`:if(t.async&&typeof t.async!=`function`&&typeof t.async!=`symbol`&&!t.onLoad&&!t.onError&&t.src&&typeof t.src==`string`)return!0}return!1}function Wf(e){return!(e.type===`stylesheet`&&!(e.state.loading&3))}function Gf(e,t,n,r){if(n.type===`stylesheet`&&(typeof r.media!=`string`||!1!==matchMedia(r.media).matches)&&!(n.state.loading&4)){if(n.instance===null){var i=Af(r.href),a=t.querySelector(jf(i));if(a){t=a._p,typeof t==`object`&&t&&typeof t.then==`function`&&(e.count++,e=Jf.bind(e),t.then(e,e)),n.state.loading|=4,n.instance=a,wt(a);return}a=t.ownerDocument||t,r=Mf(r),(i=mf.get(i))&&Rf(r,i),a=a.createElement(`link`),wt(a);var o=a;o._p=new Promise(function(e,t){o.onload=e,o.onerror=t}),Pd(a,`link`,r),n.instance=a}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(n,t),(t=n.state.preload)&&!(n.state.loading&3)&&(e.count++,n=Jf.bind(e),t.addEventListener(`load`,n),t.addEventListener(`error`,n))}}var Kf=0;function qf(e,t){return e.stylesheets&&e.count===0&&Xf(e,e.stylesheets),0<e.count||0<e.imgCount?function(n){var r=setTimeout(function(){if(e.stylesheets&&Xf(e,e.stylesheets),e.unsuspend){var t=e.unsuspend;e.unsuspend=null,t()}},6e4+t);0<e.imgBytes&&Kf===0&&(Kf=62500*Ld());var i=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&Xf(e,e.stylesheets),e.unsuspend)){var t=e.unsuspend;e.unsuspend=null,t()}},(e.imgBytes>Kf?50:800)+t);return e.unsuspend=n,function(){e.unsuspend=null,clearTimeout(r),clearTimeout(i)}}:null}function Jf(){if(this.count--,this.count===0&&(this.imgCount===0||!this.waitingForImages)){if(this.stylesheets)Xf(this,this.stylesheets);else if(this.unsuspend){var e=this.unsuspend;this.unsuspend=null,e()}}}var Yf=null;function Xf(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,Yf=new Map,t.forEach(Zf,e),Yf=null,Jf.call(e))}function Zf(e,t){if(!(t.state.loading&4)){var n=Yf.get(e);if(n)var r=n.get(null);else{n=new Map,Yf.set(e,n);for(var i=e.querySelectorAll(`link[data-precedence],style[data-precedence]`),a=0;a<i.length;a++){var o=i[a];(o.nodeName===`LINK`||o.getAttribute(`media`)!==`not all`)&&(n.set(o.dataset.precedence,o),r=o)}r&&n.set(null,r)}i=t.instance,o=i.getAttribute(`data-precedence`),a=n.get(o)||r,a===r&&n.set(null,i),n.set(o,i),this.count++,r=Jf.bind(this),i.addEventListener(`load`,r),i.addEventListener(`error`,r),a?a.parentNode.insertBefore(i,a.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(i,e.firstChild)),t.state.loading|=4}}var Qf={$$typeof:C,Provider:null,Consumer:null,_currentValue:ce,_currentValue2:ce,_threadCount:0};function $f(e,t,n,r,i,a,o,s,c){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=et(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=et(0),this.hiddenUpdates=et(null),this.identifierPrefix=r,this.onUncaughtError=i,this.onCaughtError=a,this.onRecoverableError=o,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=c,this.incompleteTransitions=new Map}function ep(e,t,n,r,i,a,o,s,c,l,u,d){return e=new $f(e,t,n,o,c,l,u,d,s),t=1,!0===a&&(t|=24),a=li(3,null,null,t),e.current=a,a.stateNode=e,t=ca(),t.refCount++,e.pooledCache=t,t.refCount++,a.memoizedState={element:r,isDehydrated:n,cache:t},Va(a),e}function tp(e){return e?(e=si,e):si}function np(e,t,n,r,i,a){i=tp(i),r.context===null?r.context=i:r.pendingContext=i,r=Ua(t),r.payload={element:n},a=a===void 0?null:a,a!==null&&(r.callback=a),n=Wa(e,r,t),n!==null&&(hu(n,e,t),Ga(n,e,t))}function rp(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function ip(e,t){rp(e,t),(e=e.alternate)&&rp(e,t)}function ap(e){if(e.tag===13||e.tag===31){var t=ii(e,67108864);t!==null&&hu(t,e,67108864),ip(e,67108864)}}function op(e){if(e.tag===13||e.tag===31){var t=pu();t=ot(t);var n=ii(e,t);n!==null&&hu(n,e,t),ip(e,t)}}var sp=!0;function cp(e,t,n,r){var i=O.T;O.T=null;var a=k.p;try{k.p=2,up(e,t,n,r)}finally{k.p=a,O.T=i}}function lp(e,t,n,r){var i=O.T;O.T=null;var a=k.p;try{k.p=8,up(e,t,n,r)}finally{k.p=a,O.T=i}}function up(e,t,n,r){if(sp){var i=dp(r);if(i===null)wd(e,t,r,fp,n),Cp(e,r);else if(Tp(i,e,t,n,r))r.stopPropagation();else if(Cp(e,r),t&4&&-1<Sp.indexOf(e)){for(;i!==null;){var a=xt(i);if(a!==null)switch(a.tag){case 3:if(a=a.stateNode,a.current.memoizedState.isDehydrated){var o=Ye(a.pendingLanes);if(o!==0){var s=a;for(s.pendingLanes|=2,s.entangledLanes|=2;o;){var c=1<<31-He(o);s.entanglements[1]|=c,o&=~c}rd(a),!(G&6)&&(tu=Ae()+500,id(0,!1))}}break;case 31:case 13:s=ii(a,2),s!==null&&hu(s,a,2),bu(),ip(a,2)}if(a=dp(r),a===null&&wd(e,t,r,fp,n),a===i)break;i=a}i!==null&&r.stopPropagation()}else wd(e,t,r,null,n)}}function dp(e){return e=nn(e),pp(e)}var fp=null;function pp(e){if(fp=null,e=bt(e),e!==null){var t=o(e);if(t===null)e=null;else{var n=t.tag;if(n===13){if(e=s(t),e!==null)return e;e=null}else if(n===31){if(e=c(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return fp=e,null}function mp(e){switch(e){case`beforetoggle`:case`cancel`:case`click`:case`close`:case`contextmenu`:case`copy`:case`cut`:case`auxclick`:case`dblclick`:case`dragend`:case`dragstart`:case`drop`:case`focusin`:case`focusout`:case`input`:case`invalid`:case`keydown`:case`keypress`:case`keyup`:case`mousedown`:case`mouseup`:case`paste`:case`pause`:case`play`:case`pointercancel`:case`pointerdown`:case`pointerup`:case`ratechange`:case`reset`:case`resize`:case`seeked`:case`submit`:case`toggle`:case`touchcancel`:case`touchend`:case`touchstart`:case`volumechange`:case`change`:case`selectionchange`:case`textInput`:case`compositionstart`:case`compositionend`:case`compositionupdate`:case`beforeblur`:case`afterblur`:case`beforeinput`:case`blur`:case`fullscreenchange`:case`focus`:case`hashchange`:case`popstate`:case`select`:case`selectstart`:return 2;case`drag`:case`dragenter`:case`dragexit`:case`dragleave`:case`dragover`:case`mousemove`:case`mouseout`:case`mouseover`:case`pointermove`:case`pointerout`:case`pointerover`:case`scroll`:case`touchmove`:case`wheel`:case`mouseenter`:case`mouseleave`:case`pointerenter`:case`pointerleave`:return 8;case`message`:switch(je()){case Me:return 2;case Ne:return 8;case Pe:case Fe:return 32;case Ie:return 268435456;default:return 32}default:return 32}}var hp=!1,gp=null,_p=null,vp=null,yp=new Map,bp=new Map,xp=[],Sp=`mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset`.split(` `);function Cp(e,t){switch(e){case`focusin`:case`focusout`:gp=null;break;case`dragenter`:case`dragleave`:_p=null;break;case`mouseover`:case`mouseout`:vp=null;break;case`pointerover`:case`pointerout`:yp.delete(t.pointerId);break;case`gotpointercapture`:case`lostpointercapture`:bp.delete(t.pointerId)}}function wp(e,t,n,r,i,a){return e===null||e.nativeEvent!==a?(e={blockedOn:t,domEventName:n,eventSystemFlags:r,nativeEvent:a,targetContainers:[i]},t!==null&&(t=xt(t),t!==null&&ap(t)),e):(e.eventSystemFlags|=r,t=e.targetContainers,i!==null&&t.indexOf(i)===-1&&t.push(i),e)}function Tp(e,t,n,r,i){switch(t){case`focusin`:return gp=wp(gp,e,t,n,r,i),!0;case`dragenter`:return _p=wp(_p,e,t,n,r,i),!0;case`mouseover`:return vp=wp(vp,e,t,n,r,i),!0;case`pointerover`:var a=i.pointerId;return yp.set(a,wp(yp.get(a)||null,e,t,n,r,i)),!0;case`gotpointercapture`:return a=i.pointerId,bp.set(a,wp(bp.get(a)||null,e,t,n,r,i)),!0}return!1}function Ep(e){var t=bt(e.target);if(t!==null){var n=o(t);if(n!==null){if(t=n.tag,t===13){if(t=s(n),t!==null){e.blockedOn=t,lt(e.priority,function(){op(n)});return}}else if(t===31){if(t=c(n),t!==null){e.blockedOn=t,lt(e.priority,function(){op(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Dp(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=dp(e.nativeEvent);if(n===null){n=e.nativeEvent;var r=new n.constructor(n.type,n);tn=r,n.target.dispatchEvent(r),tn=null}else return t=xt(n),t!==null&&ap(t),e.blockedOn=n,!1;t.shift()}return!0}function Op(e,t,n){Dp(e)&&n.delete(t)}function kp(){hp=!1,gp!==null&&Dp(gp)&&(gp=null),_p!==null&&Dp(_p)&&(_p=null),vp!==null&&Dp(vp)&&(vp=null),yp.forEach(Op),bp.forEach(Op)}function Ap(e,n){e.blockedOn===n&&(e.blockedOn=null,hp||(hp=!0,t.unstable_scheduleCallback(t.unstable_NormalPriority,kp)))}var jp=null;function Mp(e){jp!==e&&(jp=e,t.unstable_scheduleCallback(t.unstable_NormalPriority,function(){jp===e&&(jp=null);for(var t=0;t<e.length;t+=3){var n=e[t],r=e[t+1],i=e[t+2];if(typeof r!=`function`){if(pp(r||n)===null)continue;break}var a=xt(n);a!==null&&(e.splice(t,3),t-=3,Ts(a,{pending:!0,data:i,method:n.method,action:r},r,i))}}))}function Np(e){function t(t){return Ap(t,e)}gp!==null&&Ap(gp,e),_p!==null&&Ap(_p,e),vp!==null&&Ap(vp,e),yp.forEach(t),bp.forEach(t);for(var n=0;n<xp.length;n++){var r=xp[n];r.blockedOn===e&&(r.blockedOn=null)}for(;0<xp.length&&(n=xp[0],n.blockedOn===null);)Ep(n),n.blockedOn===null&&xp.shift();if(n=(e.ownerDocument||e).$$reactFormReplay,n!=null)for(r=0;r<n.length;r+=3){var i=n[r],a=n[r+1],o=i[ft]||null;if(typeof a==`function`)o||Mp(n);else if(o){var s=null;if(a&&a.hasAttribute(`formAction`)){if(i=a,o=a[ft]||null)s=o.formAction;else if(pp(i)!==null)continue}else s=o.action;typeof s==`function`?n[r+1]=s:(n.splice(r,3),r-=3),Mp(n)}}}function Pp(){function e(e){e.canIntercept&&e.info===`react-transition`&&e.intercept({handler:function(){return new Promise(function(e){return i=e})},focusReset:`manual`,scroll:`manual`})}function t(){i!==null&&(i(),i=null),r||setTimeout(n,20)}function n(){if(!r&&!navigation.transition){var e=navigation.currentEntry;e&&e.url!=null&&navigation.navigate(e.url,{state:e.getState(),info:`react-transition`,history:`replace`})}}if(typeof navigation==`object`){var r=!1,i=null;return navigation.addEventListener(`navigate`,e),navigation.addEventListener(`navigatesuccess`,t),navigation.addEventListener(`navigateerror`,t),setTimeout(n,100),function(){r=!0,navigation.removeEventListener(`navigate`,e),navigation.removeEventListener(`navigatesuccess`,t),navigation.removeEventListener(`navigateerror`,t),i!==null&&(i(),i=null)}}}function Fp(e){this._internalRoot=e}Ip.prototype.render=Fp.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(i(409));var n=t.current;np(n,pu(),e,t,null,null)},Ip.prototype.unmount=Fp.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;np(e.current,2,null,e,null,null),bu(),t[pt]=null}};function Ip(e){this._internalRoot=e}Ip.prototype.unstable_scheduleHydration=function(e){if(e){var t=ct();e={blockedOn:null,target:e,priority:t};for(var n=0;n<xp.length&&t!==0&&t<xp[n].priority;n++);xp.splice(n,0,e),n===0&&Ep(e)}};var Lp=n.version;if(Lp!==`19.2.7`)throw Error(i(527,Lp,`19.2.7`));k.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render==`function`?Error(i(188)):(e=Object.keys(e).join(`,`),Error(i(268,e)));return e=u(t),e=e===null?null:f(e),e=e===null?null:e.stateNode,e};var Rp={bundleType:0,version:`19.2.7`,rendererPackageName:`react-dom`,currentDispatcherRef:O,reconcilerVersion:`19.2.7`};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<`u`){var zp=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!zp.isDisabled&&zp.supportsFiber)try{ze=zp.inject(Rp),Be=zp}catch{}}e.createRoot=function(e,t){if(!a(e))throw Error(i(299));var n=!1,r=``,o=Js,s=Ys,c=Xs;return t!=null&&(!0===t.unstable_strictMode&&(n=!0),t.identifierPrefix!==void 0&&(r=t.identifierPrefix),t.onUncaughtError!==void 0&&(o=t.onUncaughtError),t.onCaughtError!==void 0&&(s=t.onCaughtError),t.onRecoverableError!==void 0&&(c=t.onRecoverableError)),t=ep(e,1,!1,null,null,n,r,null,o,s,c,Pp),e[pt]=t.current,Sd(e),new Fp(t)}})),_=o(((e,t)=>{function n(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>`u`||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!=`function`))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(e){console.error(e)}}n(),t.exports=g()})),v=o((e=>{var t=Symbol.for(`react.transitional.element`),n=Symbol.for(`react.fragment`);function r(e,n,r){var i=null;if(r!==void 0&&(i=``+r),n.key!==void 0&&(i=``+n.key),`key`in n)for(var a in r={},n)a!==`key`&&(r[a]=n[a]);else r=n;return n=r.ref,{$$typeof:t,type:e,key:i,ref:n===void 0?null:n,props:r}}e.Fragment=n,e.jsx=r,e.jsxs=r})),y=o(((e,t)=>{t.exports=v()})),b=d(),x=_(),S=y();function C(){return(0,S.jsxs)(`header`,{className:`sx-hero`,children:[(0,S.jsxs)(`span`,{className:`sx-hero__badge`,children:[(0,S.jsx)(`span`,{className:`sx-hero__dot`,"aria-hidden":`true`}),`v1.0.0 · 工程化训练平台`]}),(0,S.jsxs)(`h1`,{className:`sx-hero__title`,children:[`Dev`,(0,S.jsx)(`span`,{className:`sx-hero__title-accent`,children:`Forge`})]}),(0,S.jsx)(`p`,{className:`sx-hero__subtitle`,children:`锻造工业级代码能力 — 从练习场到战场的工程化训练平台。在真实代码里修 Bug、提 PR、跑 CI,而非只读教程。`}),(0,S.jsxs)(`div`,{className:`sx-hero__kbd-hint`,children:[(0,S.jsx)(`span`,{children:`按`}),(0,S.jsx)(`kbd`,{className:`sx-kbd`,children:`⌘`}),(0,S.jsx)(`kbd`,{className:`sx-kbd`,children:`K`}),(0,S.jsx)(`span`,{children:`打开命令面板`})]})]})}function w(...e){return e.filter(Boolean).join(` `)}function T({data:e=[],selection:t,onSelect:n,onReset:r,onCtaClick:i}){let{l1:a,l2:o,l3:s}=t||{l1:``,l2:``,l3:``},c=e.find(e=>e.id===a)||null,l=c?.children?.find(e=>e.id===o)||null;return(0,S.jsxs)(`div`,{className:`sx-funnel`,children:[(0,S.jsxs)(`section`,{className:`sx-step`,children:[(0,S.jsxs)(`div`,{className:`sx-step__head`,children:[(0,S.jsx)(`span`,{className:`sx-step__index`,children:`L1`}),(0,S.jsxs)(`h3`,{className:`sx-step__title`,children:[`选择方向 `,(0,S.jsx)(`em`,{children:c?`· ${c.title}`:``})]})]}),(0,S.jsx)(`div`,{className:`sx-step__grid sx-step__grid--l1`,children:e.map(e=>(0,S.jsx)(E,{level:1,node:e,active:a===e.id,onSelect:()=>n(1,e)},e.id))})]}),c&&c.children?.length>0&&(0,S.jsxs)(`section`,{className:`sx-step`,children:[(0,S.jsxs)(`div`,{className:`sx-step__head`,children:[(0,S.jsx)(`span`,{className:`sx-step__index`,children:`L2`}),(0,S.jsxs)(`h3`,{className:`sx-step__title`,children:[`选择子方向 `,(0,S.jsx)(`em`,{children:l?`· ${l.title}`:``})]})]}),(0,S.jsx)(`div`,{className:`sx-step__grid sx-step__grid--l2`,children:c.children.map(e=>(0,S.jsx)(E,{level:2,node:e,active:o===e.id,onSelect:()=>n(2,e)},e.id))})]}),l&&l.children?.length>0&&(0,S.jsxs)(`section`,{className:`sx-step`,children:[(0,S.jsxs)(`div`,{className:`sx-step__head`,children:[(0,S.jsx)(`span`,{className:`sx-step__index`,children:`L3`}),(0,S.jsxs)(`h3`,{className:`sx-step__title`,children:[`落地靶场 `,(0,S.jsxs)(`em`,{children:[l.children.length,` 项`]})]})]}),(0,S.jsx)(`div`,{className:`sx-step__grid sx-step__grid--l3`,children:l.children.map(e=>(0,S.jsx)(ee,{node:e,active:s===e.id,onSelect:()=>n(3,e),onCtaClick:i},e.id))})]}),(a||o||s)&&(0,S.jsxs)(`div`,{className:`sx-funnel__actions`,children:[(0,S.jsx)(`button`,{type:`button`,className:`sx-funnel__reset`,onClick:r,children:`↺ 重置选择`}),(0,S.jsx)(`span`,{className:`sx-funnel__hint`,children:l?`选择靶场开始实操 →`:c?`选择子方向继续下钻 →`:`从 L1 开始选择`})]})]})}function E({level:e,node:t,active:n,onSelect:r}){let i=t.status===`wip`;return(0,S.jsxs)(`button`,{type:`button`,className:w(`sx-choice`,e===1?`sx-choice--l1`:`sx-choice--l2`,n&&`is-active`,i&&`is-disabled`),onClick:r,disabled:i,children:[i&&(0,S.jsx)(`span`,{className:`sx-choice__badge`,children:`WIP`}),(0,S.jsx)(`span`,{className:`sx-choice__title`,children:t.title}),t.desc&&(0,S.jsx)(`span`,{className:`sx-choice__desc`,children:t.desc})]})}function ee({node:e,active:t,onSelect:n,onCtaClick:r}){let i=e.cta;return(0,S.jsxs)(`div`,{className:w(`sx-target`,t&&`is-active`),style:t?{borderColor:`var(--sx-accent)`}:void 0,children:[e.tag&&(0,S.jsx)(`span`,{className:`sx-target__tag`,children:e.tag}),(0,S.jsx)(`h4`,{className:`sx-target__title`,children:e.title}),e.desc&&(0,S.jsx)(`p`,{className:`sx-target__desc`,children:e.desc}),(0,S.jsx)(`div`,{style:{display:`flex`,gap:8,alignItems:`center`},children:(0,S.jsx)(`button`,{type:`button`,className:`sx-target__cta`,onClick:()=>{n?.(),i&&r?.(i)},children:i?.label||`打开 →`})})]})}function D(e,t){let n=t||{};return(e[e.length-1]===``?[...e,``]:e).join((n.padRight?` `:``)+`,`+(n.padLeft===!1?``:` `)).trim()}var te=/^[$_\p{ID_Start}][$_\u{200C}\u{200D}\p{ID_Continue}]*$/u,ne=/^[$_\p{ID_Start}][-$_\u{200C}\u{200D}\p{ID_Continue}]*$/u,re={};function ie(e,t){return((t||re).jsx?ne:te).test(e)}var ae=/[ \t\n\f\r]/g;function oe(e){return typeof e==`object`?e.type===`text`&&se(e.value):se(e)}function se(e){return e.replace(ae,``)===``}var O=class{constructor(e,t,n){this.normal=t,this.property=e,n&&(this.space=n)}};O.prototype.normal={},O.prototype.property={},O.prototype.space=void 0;function k(e,t){let n={},r={};for(let t of e)Object.assign(n,t.property),Object.assign(r,t.normal);return new O(n,r,t)}function ce(e){return e.toLowerCase()}var le=class{constructor(e,t){this.attribute=t,this.property=e}};le.prototype.attribute=``,le.prototype.booleanish=!1,le.prototype.boolean=!1,le.prototype.commaOrSpaceSeparated=!1,le.prototype.commaSeparated=!1,le.prototype.defined=!1,le.prototype.mustUseProperty=!1,le.prototype.number=!1,le.prototype.overloadedBoolean=!1,le.prototype.property=``,le.prototype.spaceSeparated=!1,le.prototype.space=void 0;var ue=s({boolean:()=>A,booleanish:()=>j,commaOrSpaceSeparated:()=>me,commaSeparated:()=>pe,number:()=>M,overloadedBoolean:()=>fe,spaceSeparated:()=>N}),de=0,A=he(),j=he(),fe=he(),M=he(),N=he(),pe=he(),me=he();function he(){return 2**++de}var ge=Object.keys(ue),_e=class extends le{constructor(e,t,n,r){let i=-1;if(super(e,t),ve(this,`space`,r),typeof n==`number`)for(;++i<ge.length;){let e=ge[i];ve(this,ge[i],(n&ue[e])===ue[e])}}};_e.prototype.defined=!0;function ve(e,t,n){n&&(e[t]=n)}function ye(e){let t={},n={};for(let[r,i]of Object.entries(e.properties)){let a=new _e(r,e.transform(e.attributes||{},r),i,e.space);e.mustUseProperty&&e.mustUseProperty.includes(r)&&(a.mustUseProperty=!0),t[r]=a,n[ce(r)]=r,n[ce(a.attribute)]=r}return new O(t,n,e.space)}var be=ye({properties:{ariaActiveDescendant:null,ariaAtomic:j,ariaAutoComplete:null,ariaBusy:j,ariaChecked:j,ariaColCount:M,ariaColIndex:M,ariaColSpan:M,ariaControls:N,ariaCurrent:null,ariaDescribedBy:N,ariaDetails:null,ariaDisabled:j,ariaDropEffect:N,ariaErrorMessage:null,ariaExpanded:j,ariaFlowTo:N,ariaGrabbed:j,ariaHasPopup:null,ariaHidden:j,ariaInvalid:null,ariaKeyShortcuts:null,ariaLabel:null,ariaLabelledBy:N,ariaLevel:M,ariaLive:null,ariaModal:j,ariaMultiLine:j,ariaMultiSelectable:j,ariaOrientation:null,ariaOwns:N,ariaPlaceholder:null,ariaPosInSet:M,ariaPressed:j,ariaReadOnly:j,ariaRelevant:null,ariaRequired:j,ariaRoleDescription:N,ariaRowCount:M,ariaRowIndex:M,ariaRowSpan:M,ariaSelected:j,ariaSetSize:M,ariaSort:null,ariaValueMax:M,ariaValueMin:M,ariaValueNow:M,ariaValueText:null,role:null},transform(e,t){return t===`role`?t:`aria-`+t.slice(4).toLowerCase()}});function xe(e,t){return t in e?e[t]:t}function Se(e,t){return xe(e,t.toLowerCase())}var Ce=ye({attributes:{acceptcharset:`accept-charset`,classname:`class`,htmlfor:`for`,httpequiv:`http-equiv`},mustUseProperty:[`checked`,`multiple`,`muted`,`selected`],properties:{abbr:null,accept:pe,acceptCharset:N,accessKey:N,action:null,allow:null,allowFullScreen:A,allowPaymentRequest:A,allowUserMedia:A,alpha:A,alt:null,as:null,async:A,autoCapitalize:null,autoComplete:N,autoFocus:A,autoPlay:A,blocking:N,capture:null,charSet:null,checked:A,cite:null,className:N,closedBy:null,colorSpace:null,cols:M,colSpan:M,command:null,commandFor:null,content:null,contentEditable:j,controls:A,controlsList:N,coords:M|pe,crossOrigin:null,data:null,dateTime:null,decoding:null,default:A,defer:A,dir:null,dirName:null,disabled:A,download:fe,draggable:j,encType:null,enterKeyHint:null,fetchPriority:null,form:null,formAction:null,formEncType:null,formMethod:null,formNoValidate:A,formTarget:null,headers:N,height:M,hidden:fe,high:M,href:null,hrefLang:null,htmlFor:N,httpEquiv:N,id:null,imageSizes:null,imageSrcSet:null,inert:A,inputMode:null,integrity:null,is:null,isMap:A,itemId:null,itemProp:N,itemRef:N,itemScope:A,itemType:N,kind:null,label:null,lang:null,language:null,list:null,loading:null,loop:A,low:M,manifest:null,max:null,maxLength:M,media:null,method:null,min:null,minLength:M,multiple:A,muted:A,name:null,nonce:null,noModule:A,noValidate:A,onAbort:null,onAfterPrint:null,onAuxClick:null,onBeforeMatch:null,onBeforePrint:null,onBeforeToggle:null,onBeforeUnload:null,onBlur:null,onCancel:null,onCanPlay:null,onCanPlayThrough:null,onChange:null,onClick:null,onClose:null,onContextLost:null,onContextMenu:null,onContextRestored:null,onCopy:null,onCueChange:null,onCut:null,onDblClick:null,onDrag:null,onDragEnd:null,onDragEnter:null,onDragExit:null,onDragLeave:null,onDragOver:null,onDragStart:null,onDrop:null,onDurationChange:null,onEmptied:null,onEnded:null,onError:null,onFocus:null,onFormData:null,onHashChange:null,onInput:null,onInvalid:null,onKeyDown:null,onKeyPress:null,onKeyUp:null,onLanguageChange:null,onLoad:null,onLoadedData:null,onLoadedMetadata:null,onLoadEnd:null,onLoadStart:null,onMessage:null,onMessageError:null,onMouseDown:null,onMouseEnter:null,onMouseLeave:null,onMouseMove:null,onMouseOut:null,onMouseOver:null,onMouseUp:null,onOffline:null,onOnline:null,onPageHide:null,onPageShow:null,onPaste:null,onPause:null,onPlay:null,onPlaying:null,onPopState:null,onProgress:null,onRateChange:null,onRejectionHandled:null,onReset:null,onResize:null,onScroll:null,onScrollEnd:null,onSecurityPolicyViolation:null,onSeeked:null,onSeeking:null,onSelect:null,onSlotChange:null,onStalled:null,onStorage:null,onSubmit:null,onSuspend:null,onTimeUpdate:null,onToggle:null,onUnhandledRejection:null,onUnload:null,onVolumeChange:null,onWaiting:null,onWheel:null,open:A,optimum:M,pattern:null,ping:N,placeholder:null,playsInline:A,popover:null,popoverTarget:null,popoverTargetAction:null,poster:null,preload:null,readOnly:A,referrerPolicy:null,rel:N,required:A,reversed:A,rows:M,rowSpan:M,sandbox:N,scope:null,scoped:A,seamless:A,selected:A,shadowRootClonable:A,shadowRootCustomElementRegistry:A,shadowRootDelegatesFocus:A,shadowRootMode:null,shadowRootSerializable:A,shape:null,size:M,sizes:null,slot:null,span:M,spellCheck:j,src:null,srcDoc:null,srcLang:null,srcSet:null,start:M,step:null,style:null,tabIndex:M,target:null,title:null,translate:null,type:null,typeMustMatch:A,useMap:null,value:j,width:M,wrap:null,writingSuggestions:null,align:null,aLink:null,archive:N,axis:null,background:null,bgColor:null,border:M,borderColor:null,bottomMargin:M,cellPadding:null,cellSpacing:null,char:null,charOff:null,classId:null,clear:null,code:null,codeBase:null,codeType:null,color:null,compact:A,declare:A,event:null,face:null,frame:null,frameBorder:null,hSpace:M,leftMargin:M,link:null,longDesc:null,lowSrc:null,marginHeight:M,marginWidth:M,noResize:A,noHref:A,noShade:A,noWrap:A,object:null,profile:null,prompt:null,rev:null,rightMargin:M,rules:null,scheme:null,scrolling:j,standby:null,summary:null,text:null,topMargin:M,valueType:null,version:null,vAlign:null,vLink:null,vSpace:M,allowTransparency:null,autoCorrect:null,autoSave:null,credentialless:A,disablePictureInPicture:A,disableRemotePlayback:A,exportParts:pe,part:N,prefix:null,property:null,results:M,security:null,unselectable:null},space:`html`,transform:Se}),we=ye({attributes:{accentHeight:`accent-height`,alignmentBaseline:`alignment-baseline`,arabicForm:`arabic-form`,baselineShift:`baseline-shift`,capHeight:`cap-height`,className:`class`,clipPath:`clip-path`,clipRule:`clip-rule`,colorInterpolation:`color-interpolation`,colorInterpolationFilters:`color-interpolation-filters`,colorProfile:`color-profile`,colorRendering:`color-rendering`,crossOrigin:`crossorigin`,dataType:`datatype`,dominantBaseline:`dominant-baseline`,enableBackground:`enable-background`,fillOpacity:`fill-opacity`,fillRule:`fill-rule`,floodColor:`flood-color`,floodOpacity:`flood-opacity`,fontFamily:`font-family`,fontSize:`font-size`,fontSizeAdjust:`font-size-adjust`,fontStretch:`font-stretch`,fontStyle:`font-style`,fontVariant:`font-variant`,fontWeight:`font-weight`,glyphName:`glyph-name`,glyphOrientationHorizontal:`glyph-orientation-horizontal`,glyphOrientationVertical:`glyph-orientation-vertical`,hrefLang:`hreflang`,horizAdvX:`horiz-adv-x`,horizOriginX:`horiz-origin-x`,horizOriginY:`horiz-origin-y`,imageRendering:`image-rendering`,letterSpacing:`letter-spacing`,lightingColor:`lighting-color`,markerEnd:`marker-end`,markerMid:`marker-mid`,markerStart:`marker-start`,maskType:`mask-type`,navDown:`nav-down`,navDownLeft:`nav-down-left`,navDownRight:`nav-down-right`,navLeft:`nav-left`,navNext:`nav-next`,navPrev:`nav-prev`,navRight:`nav-right`,navUp:`nav-up`,navUpLeft:`nav-up-left`,navUpRight:`nav-up-right`,onAbort:`onabort`,onActivate:`onactivate`,onAfterPrint:`onafterprint`,onBeforePrint:`onbeforeprint`,onBegin:`onbegin`,onCancel:`oncancel`,onCanPlay:`oncanplay`,onCanPlayThrough:`oncanplaythrough`,onChange:`onchange`,onClick:`onclick`,onClose:`onclose`,onCopy:`oncopy`,onCueChange:`oncuechange`,onCut:`oncut`,onDblClick:`ondblclick`,onDrag:`ondrag`,onDragEnd:`ondragend`,onDragEnter:`ondragenter`,onDragExit:`ondragexit`,onDragLeave:`ondragleave`,onDragOver:`ondragover`,onDragStart:`ondragstart`,onDrop:`ondrop`,onDurationChange:`ondurationchange`,onEmptied:`onemptied`,onEnd:`onend`,onEnded:`onended`,onError:`onerror`,onFocus:`onfocus`,onFocusIn:`onfocusin`,onFocusOut:`onfocusout`,onHashChange:`onhashchange`,onInput:`oninput`,onInvalid:`oninvalid`,onKeyDown:`onkeydown`,onKeyPress:`onkeypress`,onKeyUp:`onkeyup`,onLoad:`onload`,onLoadedData:`onloadeddata`,onLoadedMetadata:`onloadedmetadata`,onLoadStart:`onloadstart`,onMessage:`onmessage`,onMouseDown:`onmousedown`,onMouseEnter:`onmouseenter`,onMouseLeave:`onmouseleave`,onMouseMove:`onmousemove`,onMouseOut:`onmouseout`,onMouseOver:`onmouseover`,onMouseUp:`onmouseup`,onMouseWheel:`onmousewheel`,onOffline:`onoffline`,onOnline:`ononline`,onPageHide:`onpagehide`,onPageShow:`onpageshow`,onPaste:`onpaste`,onPause:`onpause`,onPlay:`onplay`,onPlaying:`onplaying`,onPopState:`onpopstate`,onProgress:`onprogress`,onRateChange:`onratechange`,onRepeat:`onrepeat`,onReset:`onreset`,onResize:`onresize`,onScroll:`onscroll`,onSeeked:`onseeked`,onSeeking:`onseeking`,onSelect:`onselect`,onShow:`onshow`,onStalled:`onstalled`,onStorage:`onstorage`,onSubmit:`onsubmit`,onSuspend:`onsuspend`,onTimeUpdate:`ontimeupdate`,onToggle:`ontoggle`,onUnload:`onunload`,onVolumeChange:`onvolumechange`,onWaiting:`onwaiting`,onZoom:`onzoom`,overlinePosition:`overline-position`,overlineThickness:`overline-thickness`,paintOrder:`paint-order`,panose1:`panose-1`,pointerEvents:`pointer-events`,referrerPolicy:`referrerpolicy`,renderingIntent:`rendering-intent`,shapeRendering:`shape-rendering`,stopColor:`stop-color`,stopOpacity:`stop-opacity`,strikethroughPosition:`strikethrough-position`,strikethroughThickness:`strikethrough-thickness`,strokeDashArray:`stroke-dasharray`,strokeDashOffset:`stroke-dashoffset`,strokeLineCap:`stroke-linecap`,strokeLineJoin:`stroke-linejoin`,strokeMiterLimit:`stroke-miterlimit`,strokeOpacity:`stroke-opacity`,strokeWidth:`stroke-width`,tabIndex:`tabindex`,textAnchor:`text-anchor`,textDecoration:`text-decoration`,textRendering:`text-rendering`,transformOrigin:`transform-origin`,typeOf:`typeof`,underlinePosition:`underline-position`,underlineThickness:`underline-thickness`,unicodeBidi:`unicode-bidi`,unicodeRange:`unicode-range`,unitsPerEm:`units-per-em`,vAlphabetic:`v-alphabetic`,vHanging:`v-hanging`,vIdeographic:`v-ideographic`,vMathematical:`v-mathematical`,vectorEffect:`vector-effect`,vertAdvY:`vert-adv-y`,vertOriginX:`vert-origin-x`,vertOriginY:`vert-origin-y`,wordSpacing:`word-spacing`,writingMode:`writing-mode`,xHeight:`x-height`,playbackOrder:`playbackorder`,timelineBegin:`timelinebegin`},properties:{about:me,accentHeight:M,accumulate:null,additive:null,alignmentBaseline:null,alphabetic:M,amplitude:M,arabicForm:null,ascent:M,attributeName:null,attributeType:null,azimuth:M,bandwidth:null,baselineShift:null,baseFrequency:null,baseProfile:null,bbox:null,begin:null,bias:M,by:null,calcMode:null,capHeight:M,className:N,clip:null,clipPath:null,clipPathUnits:null,clipRule:null,color:null,colorInterpolation:null,colorInterpolationFilters:null,colorProfile:null,colorRendering:null,content:null,contentScriptType:null,contentStyleType:null,crossOrigin:null,cursor:null,cx:null,cy:null,d:null,dataType:null,defaultAction:null,descent:M,diffuseConstant:M,direction:null,display:null,dur:null,divisor:M,dominantBaseline:null,download:A,dx:null,dy:null,edgeMode:null,editable:null,elevation:M,enableBackground:null,end:null,event:null,exponent:M,externalResourcesRequired:null,fill:null,fillOpacity:M,fillRule:null,filter:null,filterRes:null,filterUnits:null,floodColor:null,floodOpacity:null,focusable:null,focusHighlight:null,fontFamily:null,fontSize:null,fontSizeAdjust:null,fontStretch:null,fontStyle:null,fontVariant:null,fontWeight:null,format:null,fr:null,from:null,fx:null,fy:null,g1:pe,g2:pe,glyphName:pe,glyphOrientationHorizontal:null,glyphOrientationVertical:null,glyphRef:null,gradientTransform:null,gradientUnits:null,handler:null,hanging:M,hatchContentUnits:null,hatchUnits:null,height:null,href:null,hrefLang:null,horizAdvX:M,horizOriginX:M,horizOriginY:M,id:null,ideographic:M,imageRendering:null,initialVisibility:null,in:null,in2:null,intercept:M,k:M,k1:M,k2:M,k3:M,k4:M,kernelMatrix:me,kernelUnitLength:null,keyPoints:null,keySplines:null,keyTimes:null,kerning:null,lang:null,lengthAdjust:null,letterSpacing:null,lightingColor:null,limitingConeAngle:M,local:null,markerEnd:null,markerMid:null,markerStart:null,markerHeight:null,markerUnits:null,markerWidth:null,mask:null,maskContentUnits:null,maskType:null,maskUnits:null,mathematical:null,max:null,media:null,mediaCharacterEncoding:null,mediaContentEncodings:null,mediaSize:M,mediaTime:null,method:null,min:null,mode:null,name:null,navDown:null,navDownLeft:null,navDownRight:null,navLeft:null,navNext:null,navPrev:null,navRight:null,navUp:null,navUpLeft:null,navUpRight:null,numOctaves:null,observer:null,offset:null,onAbort:null,onActivate:null,onAfterPrint:null,onBeforePrint:null,onBegin:null,onCancel:null,onCanPlay:null,onCanPlayThrough:null,onChange:null,onClick:null,onClose:null,onCopy:null,onCueChange:null,onCut:null,onDblClick:null,onDrag:null,onDragEnd:null,onDragEnter:null,onDragExit:null,onDragLeave:null,onDragOver:null,onDragStart:null,onDrop:null,onDurationChange:null,onEmptied:null,onEnd:null,onEnded:null,onError:null,onFocus:null,onFocusIn:null,onFocusOut:null,onHashChange:null,onInput:null,onInvalid:null,onKeyDown:null,onKeyPress:null,onKeyUp:null,onLoad:null,onLoadedData:null,onLoadedMetadata:null,onLoadStart:null,onMessage:null,onMouseDown:null,onMouseEnter:null,onMouseLeave:null,onMouseMove:null,onMouseOut:null,onMouseOver:null,onMouseUp:null,onMouseWheel:null,onOffline:null,onOnline:null,onPageHide:null,onPageShow:null,onPaste:null,onPause:null,onPlay:null,onPlaying:null,onPopState:null,onProgress:null,onRateChange:null,onRepeat:null,onReset:null,onResize:null,onScroll:null,onSeeked:null,onSeeking:null,onSelect:null,onShow:null,onStalled:null,onStorage:null,onSubmit:null,onSuspend:null,onTimeUpdate:null,onToggle:null,onUnload:null,onVolumeChange:null,onWaiting:null,onZoom:null,opacity:null,operator:null,order:null,orient:null,orientation:null,origin:null,overflow:null,overlay:null,overlinePosition:M,overlineThickness:M,paintOrder:null,panose1:null,path:null,pathLength:M,patternContentUnits:null,patternTransform:null,patternUnits:null,phase:null,ping:N,pitch:null,playbackOrder:null,pointerEvents:null,points:null,pointsAtX:M,pointsAtY:M,pointsAtZ:M,preserveAlpha:null,preserveAspectRatio:null,primitiveUnits:null,propagate:null,property:me,r:null,radius:null,referrerPolicy:null,refX:null,refY:null,rel:me,rev:me,renderingIntent:null,repeatCount:null,repeatDur:null,requiredExtensions:me,requiredFeatures:me,requiredFonts:me,requiredFormats:me,resource:null,restart:null,result:null,rotate:null,rx:null,ry:null,scale:null,seed:null,shapeRendering:null,side:null,slope:null,snapshotTime:null,specularConstant:M,specularExponent:M,spreadMethod:null,spacing:null,startOffset:null,stdDeviation:null,stemh:null,stemv:null,stitchTiles:null,stopColor:null,stopOpacity:null,strikethroughPosition:M,strikethroughThickness:M,string:null,stroke:null,strokeDashArray:me,strokeDashOffset:null,strokeLineCap:null,strokeLineJoin:null,strokeMiterLimit:M,strokeOpacity:M,strokeWidth:null,style:null,surfaceScale:M,syncBehavior:null,syncBehaviorDefault:null,syncMaster:null,syncTolerance:null,syncToleranceDefault:null,systemLanguage:me,tabIndex:M,tableValues:null,target:null,targetX:M,targetY:M,textAnchor:null,textDecoration:null,textRendering:null,textLength:null,timelineBegin:null,title:null,transformBehavior:null,type:null,typeOf:me,to:null,transform:null,transformOrigin:null,u1:null,u2:null,underlinePosition:M,underlineThickness:M,unicode:null,unicodeBidi:null,unicodeRange:null,unitsPerEm:M,values:null,vAlphabetic:M,vMathematical:M,vectorEffect:null,vHanging:M,vIdeographic:M,version:null,vertAdvY:M,vertOriginX:M,vertOriginY:M,viewBox:null,viewTarget:null,visibility:null,width:null,widths:null,wordSpacing:null,writingMode:null,x:null,x1:null,x2:null,xChannelSelector:null,xHeight:M,y:null,y1:null,y2:null,yChannelSelector:null,z:null,zoomAndPan:null},space:`svg`,transform:xe}),Te=ye({properties:{xLinkActuate:null,xLinkArcRole:null,xLinkHref:null,xLinkRole:null,xLinkShow:null,xLinkTitle:null,xLinkType:null},space:`xlink`,transform(e,t){return`xlink:`+t.slice(5).toLowerCase()}}),Ee=ye({attributes:{xmlnsxlink:`xmlns:xlink`},properties:{xmlnsXLink:null,xmlns:null},space:`xmlns`,transform:Se}),De=ye({properties:{xmlBase:null,xmlLang:null,xmlSpace:null},space:`xml`,transform(e,t){return`xml:`+t.slice(3).toLowerCase()}}),Oe={classId:`classID`,dataType:`datatype`,itemId:`itemID`,strokeDashArray:`strokeDasharray`,strokeDashOffset:`strokeDashoffset`,strokeLineCap:`strokeLinecap`,strokeLineJoin:`strokeLinejoin`,strokeMiterLimit:`strokeMiterlimit`,typeOf:`typeof`,xLinkActuate:`xlinkActuate`,xLinkArcRole:`xlinkArcrole`,xLinkHref:`xlinkHref`,xLinkRole:`xlinkRole`,xLinkShow:`xlinkShow`,xLinkTitle:`xlinkTitle`,xLinkType:`xlinkType`,xmlnsXLink:`xmlnsXlink`},ke=/[A-Z]/g,Ae=/-[a-z]/g,je=/^data[-\w.:]+$/i;function Me(e,t){let n=ce(t),r=t,i=le;if(n in e.normal)return e.property[e.normal[n]];if(n.length>4&&n.slice(0,4)===`data`&&je.test(t)){if(t.charAt(4)===`-`){let e=t.slice(5).replace(Ae,Pe);r=`data`+e.charAt(0).toUpperCase()+e.slice(1)}else{let e=t.slice(4);if(!Ae.test(e)){let n=e.replace(ke,Ne);n.charAt(0)!==`-`&&(n=`-`+n),t=`data`+n}}i=_e}return new i(r,t)}function Ne(e){return`-`+e.toLowerCase()}function Pe(e){return e.charAt(1).toUpperCase()}var Fe=k([be,Ce,Te,Ee,De],`html`),Ie=k([be,we,Te,Ee,De],`svg`);function Le(e){return e.join(` `).trim()}var Re=o(((e,t)=>{var n=/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g,r=/\n/g,i=/^\s*/,a=/^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/,o=/^:\s*/,s=/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/,c=/^[;\s]*/,l=/^\s+|\s+$/g;function u(e,t){if(typeof e!=`string`)throw TypeError(`First argument must be a string`);if(!e)return[];t||={};var l=1,u=1;function f(e){var t=e.match(r);t&&(l+=t.length);var n=e.lastIndexOf(`
`);u=~n?e.length-n:u+e.length}function p(){var e={line:l,column:u};return function(t){return t.position=new m(e),_(),t}}function m(e){this.start=e,this.end={line:l,column:u},this.source=t.source}m.prototype.content=e;function h(n){var r=Error(t.source+`:`+l+`:`+u+`: `+n);if(r.reason=n,r.filename=t.source,r.line=l,r.column=u,r.source=e,!t.silent)throw r}function g(t){var n=t.exec(e);if(n){var r=n[0];return f(r),e=e.slice(r.length),n}}function _(){g(i)}function v(e){var t;for(e||=[];t=y();)t!==!1&&e.push(t);return e}function y(){var t=p();if(!(e.charAt(0)!=`/`||e.charAt(1)!=`*`)){for(var n=2;e.charAt(n)!=``&&(e.charAt(n)!=`*`||e.charAt(n+1)!=`/`);)++n;if(n+=2,e.charAt(n-1)===``)return h(`End of comment missing`);var r=e.slice(2,n-2);return u+=2,f(r),e=e.slice(n),u+=2,t({type:`comment`,comment:r})}}function b(){var e=p(),t=g(a);if(t){if(y(),!g(o))return h(`property missing ':'`);var r=g(s),i=e({type:`declaration`,property:d(t[0].replace(n,``)),value:r?d(r[0].replace(n,``)):``});return g(c),i}}function x(){var e=[];v(e);for(var t;t=b();)t!==!1&&(e.push(t),v(e));return e}return _(),x()}function d(e){return e?e.replace(l,``):``}t.exports=u})),ze=o((e=>{var t=e&&e.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(e,"__esModule",{value:!0}),e.default=r;var n=t(Re());function r(e,t){let r=null;if(!e||typeof e!=`string`)return r;let i=(0,n.default)(e),a=typeof t==`function`;return i.forEach(e=>{if(e.type!==`declaration`)return;let{property:n,value:i}=e;a?t(n,i,e):i&&(r||={},r[n]=i)}),r}})),Be=o((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.camelCase=void 0;var t=/^--[a-zA-Z0-9_-]+$/,n=/-([a-z])/g,r=/^[^-]+$/,i=/^-(webkit|moz|ms|o|khtml)-/,a=/^-(ms)-/,o=function(e){return!e||r.test(e)||t.test(e)},s=function(e,t){return t.toUpperCase()},c=function(e,t){return`${t}-`};e.camelCase=function(e,t){return t===void 0&&(t={}),o(e)?e:(e=e.toLowerCase(),e=t.reactCompat?e.replace(a,c):e.replace(i,c),e.replace(n,s))}})),Ve=o(((e,t)=>{var n=(e&&e.__importDefault||function(e){return e&&e.__esModule?e:{default:e}})(ze()),r=Be();function i(e,t){var i={};return!e||typeof e!=`string`||(0,n.default)(e,function(e,n){e&&n&&(i[(0,r.camelCase)(e,t)]=n)}),i}i.default=i,t.exports=i})),He=We(`end`),Ue=We(`start`);function We(e){return t;function t(t){let n=t&&t.position&&t.position[e]||{};if(typeof n.line==`number`&&n.line>0&&typeof n.column==`number`&&n.column>0)return{line:n.line,column:n.column,offset:typeof n.offset==`number`&&n.offset>-1?n.offset:void 0}}}function Ge(e){let t=Ue(e),n=He(e);if(t&&n)return{start:t,end:n}}function Ke(e){return!e||typeof e!=`object`?``:`position`in e||`type`in e?Je(e.position):`start`in e||`end`in e?Je(e):`line`in e||`column`in e?qe(e):``}function qe(e){return Ye(e&&e.line)+`:`+Ye(e&&e.column)}function Je(e){return qe(e&&e.start)+`-`+qe(e&&e.end)}function Ye(e){return e&&typeof e==`number`?e:1}var Xe=class extends Error{constructor(e,t,n){super(),typeof t==`string`&&(n=t,t=void 0);let r=``,i={},a=!1;if(t&&(i=`line`in t&&`column`in t||`start`in t&&`end`in t?{place:t}:`type`in t?{ancestors:[t],place:t.position}:{...t}),typeof e==`string`?r=e:!i.cause&&e&&(a=!0,r=e.message,i.cause=e),!i.ruleId&&!i.source&&typeof n==`string`){let e=n.indexOf(`:`);e===-1?i.ruleId=n:(i.source=n.slice(0,e),i.ruleId=n.slice(e+1))}if(!i.place&&i.ancestors&&i.ancestors){let e=i.ancestors[i.ancestors.length-1];e&&(i.place=e.position)}let o=i.place&&`start`in i.place?i.place.start:i.place;this.ancestors=i.ancestors||void 0,this.cause=i.cause||void 0,this.column=o?o.column:void 0,this.fatal=void 0,this.file=``,this.message=r,this.line=o?o.line:void 0,this.name=Ke(i.place)||`1:1`,this.place=i.place||void 0,this.reason=this.message,this.ruleId=i.ruleId||void 0,this.source=i.source||void 0,this.stack=a&&i.cause&&typeof i.cause.stack==`string`?i.cause.stack:``,this.actual=void 0,this.expected=void 0,this.note=void 0,this.url=void 0}};Xe.prototype.file=``,Xe.prototype.name=``,Xe.prototype.reason=``,Xe.prototype.message=``,Xe.prototype.stack=``,Xe.prototype.column=void 0,Xe.prototype.line=void 0,Xe.prototype.ancestors=void 0,Xe.prototype.cause=void 0,Xe.prototype.fatal=void 0,Xe.prototype.place=void 0,Xe.prototype.ruleId=void 0,Xe.prototype.source=void 0;var Ze=l(Ve(),1),Qe={}.hasOwnProperty,$e=new Map,et=/[A-Z]/g,tt=new Set([`table`,`tbody`,`thead`,`tfoot`,`tr`]),nt=new Set([`td`,`th`]);function rt(e,t){if(!t||t.Fragment===void 0)throw TypeError("Expected `Fragment` in options");let n=t.filePath||void 0,r;if(t.development){if(typeof t.jsxDEV!=`function`)throw TypeError("Expected `jsxDEV` in options when `development: true`");r=mt(n,t.jsxDEV)}else{if(typeof t.jsx!=`function`)throw TypeError("Expected `jsx` in production options");if(typeof t.jsxs!=`function`)throw TypeError("Expected `jsxs` in production options");r=pt(n,t.jsx,t.jsxs)}let i={Fragment:t.Fragment,ancestors:[],components:t.components||{},create:r,elementAttributeNameCase:t.elementAttributeNameCase||`react`,evaluater:t.createEvaluater?t.createEvaluater():void 0,filePath:n,ignoreInvalidStyle:t.ignoreInvalidStyle||!1,passKeys:t.passKeys!==!1,passNode:t.passNode||!1,schema:t.space===`svg`?Ie:Fe,stylePropertyNameCase:t.stylePropertyNameCase||`dom`,tableCellAlignToStyle:t.tableCellAlignToStyle!==!1},a=it(i,e,void 0);return a&&typeof a!=`string`?a:i.create(e,i.Fragment,{children:a||void 0},void 0)}function it(e,t,n){if(t.type===`element`)return at(e,t,n);if(t.type===`mdxFlowExpression`||t.type===`mdxTextExpression`)return ot(e,t);if(t.type===`mdxJsxFlowElement`||t.type===`mdxJsxTextElement`)return ct(e,t,n);if(t.type===`mdxjsEsm`)return st(e,t);if(t.type===`root`)return lt(e,t,n);if(t.type===`text`)return ut(e,t)}function at(e,t,n){let r=e.schema,i=r;t.tagName.toLowerCase()===`svg`&&r.space===`html`&&(i=Ie,e.schema=i),e.ancestors.push(t);let a=bt(e,t.tagName,!1),o=ht(e,t),s=_t(e,t);return tt.has(t.tagName)&&(s=s.filter(function(e){return typeof e!=`string`||!oe(e)})),dt(e,o,a,t),ft(o,s),e.ancestors.pop(),e.schema=r,e.create(t,a,o,n)}function ot(e,t){if(t.data&&t.data.estree&&e.evaluater){let n=t.data.estree.body[0];return n.type,e.evaluater.evaluateExpression(n.expression)}xt(e,t.position)}function st(e,t){if(t.data&&t.data.estree&&e.evaluater)return e.evaluater.evaluateProgram(t.data.estree);xt(e,t.position)}function ct(e,t,n){let r=e.schema,i=r;t.name===`svg`&&r.space===`html`&&(i=Ie,e.schema=i),e.ancestors.push(t);let a=t.name===null?e.Fragment:bt(e,t.name,!0),o=gt(e,t),s=_t(e,t);return dt(e,o,a,t),ft(o,s),e.ancestors.pop(),e.schema=r,e.create(t,a,o,n)}function lt(e,t,n){let r={};return ft(r,_t(e,t)),e.create(t,e.Fragment,r,n)}function ut(e,t){return t.value}function dt(e,t,n,r){typeof n!=`string`&&n!==e.Fragment&&e.passNode&&(t.node=r)}function ft(e,t){if(t.length>0){let n=t.length>1?t:t[0];n&&(e.children=n)}}function pt(e,t,n){return r;function r(e,r,i,a){let o=Array.isArray(i.children)?n:t;return a?o(r,i,a):o(r,i)}}function mt(e,t){return n;function n(n,r,i,a){let o=Array.isArray(i.children),s=Ue(n);return t(r,i,a,o,{columnNumber:s?s.column-1:void 0,fileName:e,lineNumber:s?s.line:void 0},void 0)}}function ht(e,t){let n={},r,i;for(i in t.properties)if(i!==`children`&&Qe.call(t.properties,i)){let a=vt(e,i,t.properties[i]);if(a){let[i,o]=a;e.tableCellAlignToStyle&&i===`align`&&typeof o==`string`&&nt.has(t.tagName)?r=o:n[i]=o}}if(r){let t=n.style||={};t[e.stylePropertyNameCase===`css`?`text-align`:`textAlign`]=r}return n}function gt(e,t){let n={};for(let r of t.attributes)if(r.type===`mdxJsxExpressionAttribute`)if(r.data&&r.data.estree&&e.evaluater){let t=r.data.estree.body[0];t.type;let i=t.expression;i.type;let a=i.properties[0];a.type,Object.assign(n,e.evaluater.evaluateExpression(a.argument))}else xt(e,t.position);else{let i=r.name,a;if(r.value&&typeof r.value==`object`)if(r.value.data&&r.value.data.estree&&e.evaluater){let t=r.value.data.estree.body[0];t.type,a=e.evaluater.evaluateExpression(t.expression)}else xt(e,t.position);else a=r.value===null||r.value;n[i]=a}return n}function _t(e,t){let n=[],r=-1,i=e.passKeys?new Map:$e;for(;++r<t.children.length;){let a=t.children[r],o;if(e.passKeys){let e=a.type===`element`?a.tagName:a.type===`mdxJsxFlowElement`||a.type===`mdxJsxTextElement`?a.name:void 0;if(e){let t=i.get(e)||0;o=e+`-`+t,i.set(e,t+1)}}let s=it(e,a,o);s!==void 0&&n.push(s)}return n}function vt(e,t,n){let r=Me(e.schema,t);if(!(n==null||typeof n==`number`&&Number.isNaN(n))){if(Array.isArray(n)&&(n=r.commaSeparated?D(n):Le(n)),r.property===`style`){let t=typeof n==`object`?n:yt(e,String(n));return e.stylePropertyNameCase===`css`&&(t=St(t)),[`style`,t]}return[e.elementAttributeNameCase===`react`&&r.space?Oe[r.property]||r.property:r.attribute,n]}}function yt(e,t){try{return(0,Ze.default)(t,{reactCompat:!0})}catch(t){if(e.ignoreInvalidStyle)return{};let n=t,r=new Xe("Cannot parse `style` attribute",{ancestors:e.ancestors,cause:n,ruleId:`style`,source:`hast-util-to-jsx-runtime`});throw r.file=e.filePath||void 0,r.url=`https://github.com/syntax-tree/hast-util-to-jsx-runtime#cannot-parse-style-attribute`,r}}function bt(e,t,n){let r;if(!n)r={type:`Literal`,value:t};else if(t.includes(`.`)){let e=t.split(`.`),n=-1,i;for(;++n<e.length;){let t=ie(e[n])?{type:`Identifier`,name:e[n]}:{type:`Literal`,value:e[n]};i=i?{type:`MemberExpression`,object:i,property:t,computed:!!(n&&t.type===`Literal`),optional:!1}:t}r=i}else r=ie(t)&&!/^[a-z]/.test(t)?{type:`Identifier`,name:t}:{type:`Literal`,value:t};if(r.type===`Literal`){let t=r.value;return Qe.call(e.components,t)?e.components[t]:t}if(e.evaluater)return e.evaluater.evaluateExpression(r);xt(e)}function xt(e,t){let n=new Xe("Cannot handle MDX estrees without `createEvaluater`",{ancestors:e.ancestors,place:t,ruleId:`mdx-estree`,source:`hast-util-to-jsx-runtime`});throw n.file=e.filePath||void 0,n.url=`https://github.com/syntax-tree/hast-util-to-jsx-runtime#cannot-handle-mdx-estrees-without-createevaluater`,n}function St(e){let t={},n;for(n in e)Qe.call(e,n)&&(t[Ct(n)]=e[n]);return t}function Ct(e){let t=e.replace(et,wt);return t.slice(0,3)===`ms-`&&(t=`-`+t),t}function wt(e){return`-`+e.toLowerCase()}var Tt={action:[`form`],cite:[`blockquote`,`del`,`ins`,`q`],data:[`object`],formAction:[`button`,`input`],href:[`a`,`area`,`base`,`link`],icon:[`menuitem`],itemId:null,manifest:[`html`],ping:[`a`,`area`],poster:[`video`],src:[`audio`,`embed`,`iframe`,`img`,`input`,`script`,`source`,`track`,`video`]},Et={};function Dt(e,t){let n=t||Et;return Ot(e,typeof n.includeImageAlt!=`boolean`||n.includeImageAlt,typeof n.includeHtml!=`boolean`||n.includeHtml)}function Ot(e,t,n){if(At(e)){if(`value`in e)return e.type===`html`&&!n?``:e.value;if(t&&`alt`in e&&e.alt)return e.alt;if(`children`in e)return kt(e.children,t,n)}return Array.isArray(e)?kt(e,t,n):``}function kt(e,t,n){let r=[],i=-1;for(;++i<e.length;)r[i]=Ot(e[i],t,n);return r.join(``)}function At(e){return!!(e&&typeof e==`object`)}var jt=document.createElement(`i`);function Mt(e){let t=`&`+e+`;`;jt.innerHTML=t;let n=jt.textContent;return n.charCodeAt(n.length-1)===59&&e!==`semi`?!1:n!==t&&n}function Nt(e,t,n,r){let i=e.length,a=0,o;if(t=t<0?-t>i?0:i+t:t>i?i:t,n=n>0?n:0,r.length<1e4)o=Array.from(r),o.unshift(t,n),e.splice(...o);else for(n&&e.splice(t,n);a<r.length;)o=r.slice(a,a+1e4),o.unshift(t,0),e.splice(...o),a+=1e4,t+=1e4}function Pt(e,t){return e.length>0?(Nt(e,e.length,0,t),e):t}var Ft={}.hasOwnProperty;function It(e){let t={},n=-1;for(;++n<e.length;)Lt(t,e[n]);return t}function Lt(e,t){let n;for(n in t){let r=(Ft.call(e,n)?e[n]:void 0)||(e[n]={}),i=t[n],a;if(i)for(a in i){Ft.call(r,a)||(r[a]=[]);let e=i[a];Rt(r[a],Array.isArray(e)?e:e?[e]:[])}}}function Rt(e,t){let n=-1,r=[];for(;++n<t.length;)(t[n].add===`after`?e:r).push(t[n]);Nt(e,0,0,r)}function zt(e,t){let n=Number.parseInt(e,t);return n<9||n===11||n>13&&n<32||n>126&&n<160||n>55295&&n<57344||n>64975&&n<65008||(n&65535)==65535||(n&65535)==65534||n>1114111?`�`:String.fromCodePoint(n)}function Bt(e){return e.replace(/[\t\n\r ]+/g,` `).replace(/^ | $/g,``).toLowerCase().toUpperCase()}var Vt=Xt(/[A-Za-z]/),Ht=Xt(/[\dA-Za-z]/),Ut=Xt(/[#-'*+\--9=?A-Z^-~]/);function Wt(e){return e!==null&&(e<32||e===127)}var Gt=Xt(/\d/),Kt=Xt(/[\dA-Fa-f]/),qt=Xt(/[!-/:-@[-`{-~]/);function P(e){return e!==null&&e<-2}function F(e){return e!==null&&(e<0||e===32)}function I(e){return e===-2||e===-1||e===32}var Jt=Xt(/\p{P}|\p{S}/u),Yt=Xt(/\s/);function Xt(e){return t;function t(t){return t!==null&&t>-1&&e.test(String.fromCharCode(t))}}function Zt(e){let t=[],n=-1,r=0,i=0;for(;++n<e.length;){let a=e.charCodeAt(n),o=``;if(a===37&&Ht(e.charCodeAt(n+1))&&Ht(e.charCodeAt(n+2)))i=2;else if(a<128)/[!#$&-;=?-Z_a-z~]/.test(String.fromCharCode(a))||(o=String.fromCharCode(a));else if(a>55295&&a<57344){let t=e.charCodeAt(n+1);a<56320&&t>56319&&t<57344?(o=String.fromCharCode(a,t),i=1):o=`�`}else o=String.fromCharCode(a);o&&=(t.push(e.slice(r,n),encodeURIComponent(o)),r=n+i+1,``),i&&=(n+=i,0)}return t.join(``)+e.slice(r)}function L(e,t,n,r){let i=r?r-1:1/0,a=0;return o;function o(r){return I(r)?(e.enter(n),s(r)):t(r)}function s(r){return I(r)&&a++<i?(e.consume(r),s):(e.exit(n),t(r))}}var Qt={tokenize:$t};function $t(e){let t=e.attempt(this.parser.constructs.contentInitial,r,i),n;return t;function r(n){if(n===null){e.consume(n);return}return e.enter(`lineEnding`),e.consume(n),e.exit(`lineEnding`),L(e,t,`linePrefix`)}function i(t){return e.enter(`paragraph`),a(t)}function a(t){let r=e.enter(`chunkText`,{contentType:`text`,previous:n});return n&&(n.next=r),n=r,o(t)}function o(t){if(t===null){e.exit(`chunkText`),e.exit(`paragraph`),e.consume(t);return}return P(t)?(e.consume(t),e.exit(`chunkText`),a):(e.consume(t),o)}}var en={tokenize:nn},tn={tokenize:rn};function nn(e){let t=this,n=[],r=0,i,a,o;return s;function s(i){if(r<n.length){let a=n[r];return t.containerState=a[1],e.attempt(a[0].continuation,c,l)(i)}return l(i)}function c(e){if(r++,t.containerState._closeFlow){t.containerState._closeFlow=void 0,i&&v();let n=t.events.length,a=n,o;for(;a--;)if(t.events[a][0]===`exit`&&t.events[a][1].type===`chunkFlow`){o=t.events[a][1].end;break}_(r);let s=n;for(;s<t.events.length;)t.events[s][1].end={...o},s++;return Nt(t.events,a+1,0,t.events.slice(n)),t.events.length=s,l(e)}return s(e)}function l(a){if(r===n.length){if(!i)return f(a);if(i.currentConstruct&&i.currentConstruct.concrete)return m(a);t.interrupt=!!(i.currentConstruct&&!i._gfmTableDynamicInterruptHack)}return t.containerState={},e.check(tn,u,d)(a)}function u(e){return i&&v(),_(r),f(e)}function d(e){return t.parser.lazy[t.now().line]=r!==n.length,o=t.now().offset,m(e)}function f(n){return t.containerState={},e.attempt(tn,p,m)(n)}function p(e){return r++,n.push([t.currentConstruct,t.containerState]),f(e)}function m(n){if(n===null){i&&v(),_(0),e.consume(n);return}return i||=t.parser.flow(t.now()),e.enter(`chunkFlow`,{_tokenizer:i,contentType:`flow`,previous:a}),h(n)}function h(n){if(n===null){g(e.exit(`chunkFlow`),!0),_(0),e.consume(n);return}return P(n)?(e.consume(n),g(e.exit(`chunkFlow`)),r=0,t.interrupt=void 0,s):(e.consume(n),h)}function g(e,n){let s=t.sliceStream(e);if(n&&s.push(null),e.previous=a,a&&(a.next=e),a=e,i.defineSkip(e.start),i.write(s),t.parser.lazy[e.start.line]){let e=i.events.length;for(;e--;)if(i.events[e][1].start.offset<o&&(!i.events[e][1].end||i.events[e][1].end.offset>o))return;let n=t.events.length,a=n,s,c;for(;a--;)if(t.events[a][0]===`exit`&&t.events[a][1].type===`chunkFlow`){if(s){c=t.events[a][1].end;break}s=!0}for(_(r),e=n;e<t.events.length;)t.events[e][1].end={...c},e++;Nt(t.events,a+1,0,t.events.slice(n)),t.events.length=e}}function _(r){let i=n.length;for(;i-->r;){let r=n[i];t.containerState=r[1],r[0].exit.call(t,e)}n.length=r}function v(){i.write([null]),a=void 0,i=void 0,t.containerState._closeFlow=void 0}}function rn(e,t,n){return L(e,e.attempt(this.parser.constructs.document,t,n),`linePrefix`,this.parser.constructs.disable.null.includes(`codeIndented`)?void 0:4)}function an(e){if(e===null||F(e)||Yt(e))return 1;if(Jt(e))return 2}function on(e,t,n){let r=[],i=-1;for(;++i<e.length;){let a=e[i].resolveAll;a&&!r.includes(a)&&(t=a(t,n),r.push(a))}return t}var sn={name:`attention`,resolveAll:cn,tokenize:ln};function cn(e,t){let n=-1,r,i,a,o,s,c,l,u;for(;++n<e.length;)if(e[n][0]===`enter`&&e[n][1].type===`attentionSequence`&&e[n][1]._close){for(r=n;r--;)if(e[r][0]===`exit`&&e[r][1].type===`attentionSequence`&&e[r][1]._open&&t.sliceSerialize(e[r][1]).charCodeAt(0)===t.sliceSerialize(e[n][1]).charCodeAt(0)){if((e[r][1]._close||e[n][1]._open)&&(e[n][1].end.offset-e[n][1].start.offset)%3&&!((e[r][1].end.offset-e[r][1].start.offset+e[n][1].end.offset-e[n][1].start.offset)%3))continue;c=e[r][1].end.offset-e[r][1].start.offset>1&&e[n][1].end.offset-e[n][1].start.offset>1?2:1;let d={...e[r][1].end},f={...e[n][1].start};un(d,-c),un(f,c),o={type:c>1?`strongSequence`:`emphasisSequence`,start:d,end:{...e[r][1].end}},s={type:c>1?`strongSequence`:`emphasisSequence`,start:{...e[n][1].start},end:f},a={type:c>1?`strongText`:`emphasisText`,start:{...e[r][1].end},end:{...e[n][1].start}},i={type:c>1?`strong`:`emphasis`,start:{...o.start},end:{...s.end}},e[r][1].end={...o.start},e[n][1].start={...s.end},l=[],e[r][1].end.offset-e[r][1].start.offset&&(l=Pt(l,[[`enter`,e[r][1],t],[`exit`,e[r][1],t]])),l=Pt(l,[[`enter`,i,t],[`enter`,o,t],[`exit`,o,t],[`enter`,a,t]]),l=Pt(l,on(t.parser.constructs.insideSpan.null,e.slice(r+1,n),t)),l=Pt(l,[[`exit`,a,t],[`enter`,s,t],[`exit`,s,t],[`exit`,i,t]]),e[n][1].end.offset-e[n][1].start.offset?(u=2,l=Pt(l,[[`enter`,e[n][1],t],[`exit`,e[n][1],t]])):u=0,Nt(e,r-1,n-r+3,l),n=r+l.length-u-2;break}}for(n=-1;++n<e.length;)e[n][1].type===`attentionSequence`&&(e[n][1].type=`data`);return e}function ln(e,t){let n=this.parser.constructs.attentionMarkers.null,r=this.previous,i=an(r),a;return o;function o(t){return a=t,e.enter(`attentionSequence`),s(t)}function s(o){if(o===a)return e.consume(o),s;let c=e.exit(`attentionSequence`),l=an(o),u=!l||l===2&&i||n.includes(o),d=!i||i===2&&l||n.includes(r);return c._open=!!(a===42?u:u&&(i||!d)),c._close=!!(a===42?d:d&&(l||!u)),t(o)}}function un(e,t){e.column+=t,e.offset+=t,e._bufferIndex+=t}var dn={name:`autolink`,tokenize:fn};function fn(e,t,n){let r=0;return i;function i(t){return e.enter(`autolink`),e.enter(`autolinkMarker`),e.consume(t),e.exit(`autolinkMarker`),e.enter(`autolinkProtocol`),a}function a(t){return Vt(t)?(e.consume(t),o):t===64?n(t):l(t)}function o(e){return e===43||e===45||e===46||Ht(e)?(r=1,s(e)):l(e)}function s(t){return t===58?(e.consume(t),r=0,c):(t===43||t===45||t===46||Ht(t))&&r++<32?(e.consume(t),s):(r=0,l(t))}function c(r){return r===62?(e.exit(`autolinkProtocol`),e.enter(`autolinkMarker`),e.consume(r),e.exit(`autolinkMarker`),e.exit(`autolink`),t):r===null||r===32||r===60||Wt(r)?n(r):(e.consume(r),c)}function l(t){return t===64?(e.consume(t),u):Ut(t)?(e.consume(t),l):n(t)}function u(e){return Ht(e)?d(e):n(e)}function d(n){return n===46?(e.consume(n),r=0,u):n===62?(e.exit(`autolinkProtocol`).type=`autolinkEmail`,e.enter(`autolinkMarker`),e.consume(n),e.exit(`autolinkMarker`),e.exit(`autolink`),t):f(n)}function f(t){if((t===45||Ht(t))&&r++<63){let n=t===45?f:d;return e.consume(t),n}return n(t)}}var pn={partial:!0,tokenize:mn};function mn(e,t,n){return r;function r(t){return I(t)?L(e,i,`linePrefix`)(t):i(t)}function i(e){return e===null||P(e)?t(e):n(e)}}var hn={continuation:{tokenize:_n},exit:vn,name:`blockQuote`,tokenize:gn};function gn(e,t,n){let r=this;return i;function i(t){if(t===62){let n=r.containerState;return n.open||=(e.enter(`blockQuote`,{_container:!0}),!0),e.enter(`blockQuotePrefix`),e.enter(`blockQuoteMarker`),e.consume(t),e.exit(`blockQuoteMarker`),a}return n(t)}function a(n){return I(n)?(e.enter(`blockQuotePrefixWhitespace`),e.consume(n),e.exit(`blockQuotePrefixWhitespace`),e.exit(`blockQuotePrefix`),t):(e.exit(`blockQuotePrefix`),t(n))}}function _n(e,t,n){let r=this;return i;function i(t){return I(t)?L(e,a,`linePrefix`,r.parser.constructs.disable.null.includes(`codeIndented`)?void 0:4)(t):a(t)}function a(r){return e.attempt(hn,t,n)(r)}}function vn(e){e.exit(`blockQuote`)}var yn={name:`characterEscape`,tokenize:bn};function bn(e,t,n){return r;function r(t){return e.enter(`characterEscape`),e.enter(`escapeMarker`),e.consume(t),e.exit(`escapeMarker`),i}function i(r){return qt(r)?(e.enter(`characterEscapeValue`),e.consume(r),e.exit(`characterEscapeValue`),e.exit(`characterEscape`),t):n(r)}}var xn={name:`characterReference`,tokenize:Sn};function Sn(e,t,n){let r=this,i=0,a,o;return s;function s(t){return e.enter(`characterReference`),e.enter(`characterReferenceMarker`),e.consume(t),e.exit(`characterReferenceMarker`),c}function c(t){return t===35?(e.enter(`characterReferenceMarkerNumeric`),e.consume(t),e.exit(`characterReferenceMarkerNumeric`),l):(e.enter(`characterReferenceValue`),a=31,o=Ht,u(t))}function l(t){return t===88||t===120?(e.enter(`characterReferenceMarkerHexadecimal`),e.consume(t),e.exit(`characterReferenceMarkerHexadecimal`),e.enter(`characterReferenceValue`),a=6,o=Kt,u):(e.enter(`characterReferenceValue`),a=7,o=Gt,u(t))}function u(s){if(s===59&&i){let i=e.exit(`characterReferenceValue`);return o===Ht&&!Mt(r.sliceSerialize(i))?n(s):(e.enter(`characterReferenceMarker`),e.consume(s),e.exit(`characterReferenceMarker`),e.exit(`characterReference`),t)}return o(s)&&i++<a?(e.consume(s),u):n(s)}}var Cn={partial:!0,tokenize:En},wn={concrete:!0,name:`codeFenced`,tokenize:Tn};function Tn(e,t,n){let r=this,i={partial:!0,tokenize:x},a=0,o=0,s;return c;function c(e){return l(e)}function l(t){let n=r.events[r.events.length-1];return a=n&&n[1].type===`linePrefix`?n[2].sliceSerialize(n[1],!0).length:0,s=t,e.enter(`codeFenced`),e.enter(`codeFencedFence`),e.enter(`codeFencedFenceSequence`),u(t)}function u(t){return t===s?(o++,e.consume(t),u):o<3?n(t):(e.exit(`codeFencedFenceSequence`),I(t)?L(e,d,`whitespace`)(t):d(t))}function d(n){return n===null||P(n)?(e.exit(`codeFencedFence`),r.interrupt?t(n):e.check(Cn,h,b)(n)):(e.enter(`codeFencedFenceInfo`),e.enter(`chunkString`,{contentType:`string`}),f(n))}function f(t){return t===null||P(t)?(e.exit(`chunkString`),e.exit(`codeFencedFenceInfo`),d(t)):I(t)?(e.exit(`chunkString`),e.exit(`codeFencedFenceInfo`),L(e,p,`whitespace`)(t)):t===96&&t===s?n(t):(e.consume(t),f)}function p(t){return t===null||P(t)?d(t):(e.enter(`codeFencedFenceMeta`),e.enter(`chunkString`,{contentType:`string`}),m(t))}function m(t){return t===null||P(t)?(e.exit(`chunkString`),e.exit(`codeFencedFenceMeta`),d(t)):t===96&&t===s?n(t):(e.consume(t),m)}function h(t){return e.attempt(i,b,g)(t)}function g(t){return e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),_}function _(t){return a>0&&I(t)?L(e,v,`linePrefix`,a+1)(t):v(t)}function v(t){return t===null||P(t)?e.check(Cn,h,b)(t):(e.enter(`codeFlowValue`),y(t))}function y(t){return t===null||P(t)?(e.exit(`codeFlowValue`),v(t)):(e.consume(t),y)}function b(n){return e.exit(`codeFenced`),t(n)}function x(e,t,n){let i=0;return a;function a(t){return e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),c}function c(t){return e.enter(`codeFencedFence`),I(t)?L(e,l,`linePrefix`,r.parser.constructs.disable.null.includes(`codeIndented`)?void 0:4)(t):l(t)}function l(t){return t===s?(e.enter(`codeFencedFenceSequence`),u(t)):n(t)}function u(t){return t===s?(i++,e.consume(t),u):i>=o?(e.exit(`codeFencedFenceSequence`),I(t)?L(e,d,`whitespace`)(t):d(t)):n(t)}function d(r){return r===null||P(r)?(e.exit(`codeFencedFence`),t(r)):n(r)}}}function En(e,t,n){let r=this;return i;function i(t){return t===null?n(t):(e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),a)}function a(e){return r.parser.lazy[r.now().line]?n(e):t(e)}}var Dn={name:`codeIndented`,tokenize:kn},On={partial:!0,tokenize:An};function kn(e,t,n){let r=this;return i;function i(t){return e.enter(`codeIndented`),L(e,a,`linePrefix`,5)(t)}function a(e){let t=r.events[r.events.length-1];return t&&t[1].type===`linePrefix`&&t[2].sliceSerialize(t[1],!0).length>=4?o(e):n(e)}function o(t){return t===null?c(t):P(t)?e.attempt(On,o,c)(t):(e.enter(`codeFlowValue`),s(t))}function s(t){return t===null||P(t)?(e.exit(`codeFlowValue`),o(t)):(e.consume(t),s)}function c(n){return e.exit(`codeIndented`),t(n)}}function An(e,t,n){let r=this;return i;function i(t){return r.parser.lazy[r.now().line]?n(t):P(t)?(e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),i):L(e,a,`linePrefix`,5)(t)}function a(e){let a=r.events[r.events.length-1];return a&&a[1].type===`linePrefix`&&a[2].sliceSerialize(a[1],!0).length>=4?t(e):P(e)?i(e):n(e)}}var jn={name:`codeText`,previous:Nn,resolve:Mn,tokenize:Pn};function Mn(e){let t=e.length-4,n=3,r,i;if((e[n][1].type===`lineEnding`||e[n][1].type===`space`)&&(e[t][1].type===`lineEnding`||e[t][1].type===`space`)){for(r=n;++r<t;)if(e[r][1].type===`codeTextData`){e[n][1].type=`codeTextPadding`,e[t][1].type=`codeTextPadding`,n+=2,t-=2;break}}for(r=n-1,t++;++r<=t;)i===void 0?r!==t&&e[r][1].type!==`lineEnding`&&(i=r):(r===t||e[r][1].type===`lineEnding`)&&(e[i][1].type=`codeTextData`,r!==i+2&&(e[i][1].end=e[r-1][1].end,e.splice(i+2,r-i-2),t-=r-i-2,r=i+2),i=void 0);return e}function Nn(e){return e!==96||this.events[this.events.length-1][1].type===`characterEscape`}function Pn(e,t,n){let r=0,i,a;return o;function o(t){return e.enter(`codeText`),e.enter(`codeTextSequence`),s(t)}function s(t){return t===96?(e.consume(t),r++,s):(e.exit(`codeTextSequence`),c(t))}function c(t){return t===null?n(t):t===32?(e.enter(`space`),e.consume(t),e.exit(`space`),c):t===96?(a=e.enter(`codeTextSequence`),i=0,u(t)):P(t)?(e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),c):(e.enter(`codeTextData`),l(t))}function l(t){return t===null||t===32||t===96||P(t)?(e.exit(`codeTextData`),c(t)):(e.consume(t),l)}function u(n){return n===96?(e.consume(n),i++,u):i===r?(e.exit(`codeTextSequence`),e.exit(`codeText`),t(n)):(a.type=`codeTextData`,l(n))}}var Fn=class{constructor(e){this.left=e?[...e]:[],this.right=[]}get(e){if(e<0||e>=this.left.length+this.right.length)throw RangeError("Cannot access index `"+e+"` in a splice buffer of size `"+(this.left.length+this.right.length)+"`");return e<this.left.length?this.left[e]:this.right[this.right.length-e+this.left.length-1]}get length(){return this.left.length+this.right.length}shift(){return this.setCursor(0),this.right.pop()}slice(e,t){let n=t??1/0;return n<this.left.length?this.left.slice(e,n):e>this.left.length?this.right.slice(this.right.length-n+this.left.length,this.right.length-e+this.left.length).reverse():this.left.slice(e).concat(this.right.slice(this.right.length-n+this.left.length).reverse())}splice(e,t,n){let r=t||0;this.setCursor(Math.trunc(e));let i=this.right.splice(this.right.length-r,1/0);return n&&In(this.left,n),i.reverse()}pop(){return this.setCursor(1/0),this.left.pop()}push(e){this.setCursor(1/0),this.left.push(e)}pushMany(e){this.setCursor(1/0),In(this.left,e)}unshift(e){this.setCursor(0),this.right.push(e)}unshiftMany(e){this.setCursor(0),In(this.right,e.reverse())}setCursor(e){if(!(e===this.left.length||e>this.left.length&&this.right.length===0||e<0&&this.left.length===0))if(e<this.left.length){let t=this.left.splice(e,1/0);In(this.right,t.reverse())}else{let t=this.right.splice(this.left.length+this.right.length-e,1/0);In(this.left,t.reverse())}}};function In(e,t){let n=0;if(t.length<1e4)e.push(...t);else for(;n<t.length;)e.push(...t.slice(n,n+1e4)),n+=1e4}function Ln(e){let t={},n=-1,r,i,a,o,s,c,l,u=new Fn(e);for(;++n<u.length;){for(;n in t;)n=t[n];if(r=u.get(n),n&&r[1].type===`chunkFlow`&&u.get(n-1)[1].type===`listItemPrefix`&&(c=r[1]._tokenizer.events,a=0,a<c.length&&c[a][1].type===`lineEndingBlank`&&(a+=2),a<c.length&&c[a][1].type===`content`))for(;++a<c.length&&c[a][1].type!==`content`;)c[a][1].type===`chunkText`&&(c[a][1]._isInFirstContentOfListItem=!0,a++);if(r[0]===`enter`)r[1].contentType&&(Object.assign(t,Rn(u,n)),n=t[n],l=!0);else if(r[1]._container){for(a=n,i=void 0;a--;)if(o=u.get(a),o[1].type===`lineEnding`||o[1].type===`lineEndingBlank`)o[0]===`enter`&&(i&&(u.get(i)[1].type=`lineEndingBlank`),o[1].type=`lineEnding`,i=a);else if(!(o[1].type===`linePrefix`||o[1].type===`listItemIndent`))break;i&&(r[1].end={...u.get(i)[1].start},s=u.slice(i,n),s.unshift(r),u.splice(i,n-i+1,s))}}return Nt(e,0,1/0,u.slice(0)),!l}function Rn(e,t){let n=e.get(t)[1],r=e.get(t)[2],i=t-1,a=[],o=n._tokenizer;o||(o=r.parser[n.contentType](n.start),n._contentTypeTextTrailing&&(o._contentTypeTextTrailing=!0));let s=o.events,c=[],l={},u,d,f=-1,p=n,m=0,h=0,g=[h];for(;p;){for(;e.get(++i)[1]!==p;);a.push(i),p._tokenizer||(u=r.sliceStream(p),p.next||u.push(null),d&&o.defineSkip(p.start),p._isInFirstContentOfListItem&&(o._gfmTasklistFirstContentOfListItem=!0),o.write(u),p._isInFirstContentOfListItem&&(o._gfmTasklistFirstContentOfListItem=void 0)),d=p,p=p.next}for(p=n;++f<s.length;)s[f][0]===`exit`&&s[f-1][0]===`enter`&&s[f][1].type===s[f-1][1].type&&s[f][1].start.line!==s[f][1].end.line&&(h=f+1,g.push(h),p._tokenizer=void 0,p.previous=void 0,p=p.next);for(o.events=[],p?(p._tokenizer=void 0,p.previous=void 0):g.pop(),f=g.length;f--;){let t=s.slice(g[f],g[f+1]),n=a.pop();c.push([n,n+t.length-1]),e.splice(n,2,t)}for(c.reverse(),f=-1;++f<c.length;)l[m+c[f][0]]=m+c[f][1],m+=c[f][1]-c[f][0]-1;return l}var zn={resolve:Vn,tokenize:Hn},Bn={partial:!0,tokenize:Un};function Vn(e){return Ln(e),e}function Hn(e,t){let n;return r;function r(t){return e.enter(`content`),n=e.enter(`chunkContent`,{contentType:`content`}),i(t)}function i(t){return t===null?a(t):P(t)?e.check(Bn,o,a)(t):(e.consume(t),i)}function a(n){return e.exit(`chunkContent`),e.exit(`content`),t(n)}function o(t){return e.consume(t),e.exit(`chunkContent`),n.next=e.enter(`chunkContent`,{contentType:`content`,previous:n}),n=n.next,i}}function Un(e,t,n){let r=this;return i;function i(t){return e.exit(`chunkContent`),e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),L(e,a,`linePrefix`)}function a(i){if(i===null||P(i))return n(i);let a=r.events[r.events.length-1];return!r.parser.constructs.disable.null.includes(`codeIndented`)&&a&&a[1].type===`linePrefix`&&a[2].sliceSerialize(a[1],!0).length>=4?t(i):e.interrupt(r.parser.constructs.flow,n,t)(i)}}function Wn(e,t,n,r,i,a,o,s,c){let l=c||1/0,u=0;return d;function d(t){return t===60?(e.enter(r),e.enter(i),e.enter(a),e.consume(t),e.exit(a),f):t===null||t===32||t===41||Wt(t)?n(t):(e.enter(r),e.enter(o),e.enter(s),e.enter(`chunkString`,{contentType:`string`}),h(t))}function f(n){return n===62?(e.enter(a),e.consume(n),e.exit(a),e.exit(i),e.exit(r),t):(e.enter(s),e.enter(`chunkString`,{contentType:`string`}),p(n))}function p(t){return t===62?(e.exit(`chunkString`),e.exit(s),f(t)):t===null||t===60||P(t)?n(t):(e.consume(t),t===92?m:p)}function m(t){return t===60||t===62||t===92?(e.consume(t),p):p(t)}function h(i){return!u&&(i===null||i===41||F(i))?(e.exit(`chunkString`),e.exit(s),e.exit(o),e.exit(r),t(i)):u<l&&i===40?(e.consume(i),u++,h):i===41?(e.consume(i),u--,h):i===null||i===32||i===40||Wt(i)?n(i):(e.consume(i),i===92?g:h)}function g(t){return t===40||t===41||t===92?(e.consume(t),h):h(t)}}function Gn(e,t,n,r,i,a){let o=this,s=0,c;return l;function l(t){return e.enter(r),e.enter(i),e.consume(t),e.exit(i),e.enter(a),u}function u(l){return s>999||l===null||l===91||l===93&&!c||l===94&&!s&&`_hiddenFootnoteSupport`in o.parser.constructs?n(l):l===93?(e.exit(a),e.enter(i),e.consume(l),e.exit(i),e.exit(r),t):P(l)?(e.enter(`lineEnding`),e.consume(l),e.exit(`lineEnding`),u):(e.enter(`chunkString`,{contentType:`string`}),d(l))}function d(t){return t===null||t===91||t===93||P(t)||s++>999?(e.exit(`chunkString`),u(t)):(e.consume(t),c||=!I(t),t===92?f:d)}function f(t){return t===91||t===92||t===93?(e.consume(t),s++,d):d(t)}}function Kn(e,t,n,r,i,a){let o;return s;function s(t){return t===34||t===39||t===40?(e.enter(r),e.enter(i),e.consume(t),e.exit(i),o=t===40?41:t,c):n(t)}function c(n){return n===o?(e.enter(i),e.consume(n),e.exit(i),e.exit(r),t):(e.enter(a),l(n))}function l(t){return t===o?(e.exit(a),c(o)):t===null?n(t):P(t)?(e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),L(e,l,`linePrefix`)):(e.enter(`chunkString`,{contentType:`string`}),u(t))}function u(t){return t===o||t===null||P(t)?(e.exit(`chunkString`),l(t)):(e.consume(t),t===92?d:u)}function d(t){return t===o||t===92?(e.consume(t),u):u(t)}}function qn(e,t){let n;return r;function r(i){return P(i)?(e.enter(`lineEnding`),e.consume(i),e.exit(`lineEnding`),n=!0,r):I(i)?L(e,r,n?`linePrefix`:`lineSuffix`)(i):t(i)}}var Jn={name:`definition`,tokenize:Xn},Yn={partial:!0,tokenize:Zn};function Xn(e,t,n){let r=this,i;return a;function a(t){return e.enter(`definition`),o(t)}function o(t){return Gn.call(r,e,s,n,`definitionLabel`,`definitionLabelMarker`,`definitionLabelString`)(t)}function s(t){return i=Bt(r.sliceSerialize(r.events[r.events.length-1][1]).slice(1,-1)),t===58?(e.enter(`definitionMarker`),e.consume(t),e.exit(`definitionMarker`),c):n(t)}function c(t){return F(t)?qn(e,l)(t):l(t)}function l(t){return Wn(e,u,n,`definitionDestination`,`definitionDestinationLiteral`,`definitionDestinationLiteralMarker`,`definitionDestinationRaw`,`definitionDestinationString`)(t)}function u(t){return e.attempt(Yn,d,d)(t)}function d(t){return I(t)?L(e,f,`whitespace`)(t):f(t)}function f(a){return a===null||P(a)?(e.exit(`definition`),r.parser.defined.push(i),t(a)):n(a)}}function Zn(e,t,n){return r;function r(t){return F(t)?qn(e,i)(t):n(t)}function i(t){return Kn(e,a,n,`definitionTitle`,`definitionTitleMarker`,`definitionTitleString`)(t)}function a(t){return I(t)?L(e,o,`whitespace`)(t):o(t)}function o(e){return e===null||P(e)?t(e):n(e)}}var Qn={name:`hardBreakEscape`,tokenize:$n};function $n(e,t,n){return r;function r(t){return e.enter(`hardBreakEscape`),e.consume(t),i}function i(r){return P(r)?(e.exit(`hardBreakEscape`),t(r)):n(r)}}var er={name:`headingAtx`,resolve:tr,tokenize:nr};function tr(e,t){let n=e.length-2,r=3,i,a;return e[r][1].type===`whitespace`&&(r+=2),n-2>r&&e[n][1].type===`whitespace`&&(n-=2),e[n][1].type===`atxHeadingSequence`&&(r===n-1||n-4>r&&e[n-2][1].type===`whitespace`)&&(n-=r+1===n?2:4),n>r&&(i={type:`atxHeadingText`,start:e[r][1].start,end:e[n][1].end},a={type:`chunkText`,start:e[r][1].start,end:e[n][1].end,contentType:`text`},Nt(e,r,n-r+1,[[`enter`,i,t],[`enter`,a,t],[`exit`,a,t],[`exit`,i,t]])),e}function nr(e,t,n){let r=0;return i;function i(t){return e.enter(`atxHeading`),a(t)}function a(t){return e.enter(`atxHeadingSequence`),o(t)}function o(t){return t===35&&r++<6?(e.consume(t),o):t===null||F(t)?(e.exit(`atxHeadingSequence`),s(t)):n(t)}function s(n){return n===35?(e.enter(`atxHeadingSequence`),c(n)):n===null||P(n)?(e.exit(`atxHeading`),t(n)):I(n)?L(e,s,`whitespace`)(n):(e.enter(`atxHeadingText`),l(n))}function c(t){return t===35?(e.consume(t),c):(e.exit(`atxHeadingSequence`),s(t))}function l(t){return t===null||t===35||F(t)?(e.exit(`atxHeadingText`),s(t)):(e.consume(t),l)}}var rr=`address.article.aside.base.basefont.blockquote.body.caption.center.col.colgroup.dd.details.dialog.dir.div.dl.dt.fieldset.figcaption.figure.footer.form.frame.frameset.h1.h2.h3.h4.h5.h6.head.header.hr.html.iframe.legend.li.link.main.menu.menuitem.nav.noframes.ol.optgroup.option.p.param.search.section.summary.table.tbody.td.tfoot.th.thead.title.tr.track.ul`.split(`.`),ir=[`pre`,`script`,`style`,`textarea`],ar={concrete:!0,name:`htmlFlow`,resolveTo:cr,tokenize:lr},or={partial:!0,tokenize:dr},sr={partial:!0,tokenize:ur};function cr(e){let t=e.length;for(;t--&&!(e[t][0]===`enter`&&e[t][1].type===`htmlFlow`););return t>1&&e[t-2][1].type===`linePrefix`&&(e[t][1].start=e[t-2][1].start,e[t+1][1].start=e[t-2][1].start,e.splice(t-2,2)),e}function lr(e,t,n){let r=this,i,a,o,s,c;return l;function l(e){return u(e)}function u(t){return e.enter(`htmlFlow`),e.enter(`htmlFlowData`),e.consume(t),d}function d(s){return s===33?(e.consume(s),f):s===47?(e.consume(s),a=!0,h):s===63?(e.consume(s),i=3,r.interrupt?t:O):Vt(s)?(e.consume(s),o=String.fromCharCode(s),g):n(s)}function f(a){return a===45?(e.consume(a),i=2,p):a===91?(e.consume(a),i=5,s=0,m):Vt(a)?(e.consume(a),i=4,r.interrupt?t:O):n(a)}function p(i){return i===45?(e.consume(i),r.interrupt?t:O):n(i)}function m(i){return i===`CDATA[`.charCodeAt(s++)?(e.consume(i),s===6?r.interrupt?t:D:m):n(i)}function h(t){return Vt(t)?(e.consume(t),o=String.fromCharCode(t),g):n(t)}function g(s){if(s===null||s===47||s===62||F(s)){let c=s===47,l=o.toLowerCase();return!c&&!a&&ir.includes(l)?(i=1,r.interrupt?t(s):D(s)):rr.includes(o.toLowerCase())?(i=6,c?(e.consume(s),_):r.interrupt?t(s):D(s)):(i=7,r.interrupt&&!r.parser.lazy[r.now().line]?n(s):a?v(s):y(s))}return s===45||Ht(s)?(e.consume(s),o+=String.fromCharCode(s),g):n(s)}function _(i){return i===62?(e.consume(i),r.interrupt?t:D):n(i)}function v(t){return I(t)?(e.consume(t),v):E(t)}function y(t){return t===47?(e.consume(t),E):t===58||t===95||Vt(t)?(e.consume(t),b):I(t)?(e.consume(t),y):E(t)}function b(t){return t===45||t===46||t===58||t===95||Ht(t)?(e.consume(t),b):x(t)}function x(t){return t===61?(e.consume(t),S):I(t)?(e.consume(t),x):y(t)}function S(t){return t===null||t===60||t===61||t===62||t===96?n(t):t===34||t===39?(e.consume(t),c=t,C):I(t)?(e.consume(t),S):w(t)}function C(t){return t===c?(e.consume(t),c=null,T):t===null||P(t)?n(t):(e.consume(t),C)}function w(t){return t===null||t===34||t===39||t===47||t===60||t===61||t===62||t===96||F(t)?x(t):(e.consume(t),w)}function T(e){return e===47||e===62||I(e)?y(e):n(e)}function E(t){return t===62?(e.consume(t),ee):n(t)}function ee(t){return t===null||P(t)?D(t):I(t)?(e.consume(t),ee):n(t)}function D(t){return t===45&&i===2?(e.consume(t),ie):t===60&&i===1?(e.consume(t),ae):t===62&&i===4?(e.consume(t),k):t===63&&i===3?(e.consume(t),O):t===93&&i===5?(e.consume(t),se):P(t)&&(i===6||i===7)?(e.exit(`htmlFlowData`),e.check(or,ce,te)(t)):t===null||P(t)?(e.exit(`htmlFlowData`),te(t)):(e.consume(t),D)}function te(t){return e.check(sr,ne,ce)(t)}function ne(t){return e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),re}function re(t){return t===null||P(t)?te(t):(e.enter(`htmlFlowData`),D(t))}function ie(t){return t===45?(e.consume(t),O):D(t)}function ae(t){return t===47?(e.consume(t),o=``,oe):D(t)}function oe(t){if(t===62){let n=o.toLowerCase();return ir.includes(n)?(e.consume(t),k):D(t)}return Vt(t)&&o.length<8?(e.consume(t),o+=String.fromCharCode(t),oe):D(t)}function se(t){return t===93?(e.consume(t),O):D(t)}function O(t){return t===62?(e.consume(t),k):t===45&&i===2?(e.consume(t),O):D(t)}function k(t){return t===null||P(t)?(e.exit(`htmlFlowData`),ce(t)):(e.consume(t),k)}function ce(n){return e.exit(`htmlFlow`),t(n)}}function ur(e,t,n){let r=this;return i;function i(t){return P(t)?(e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),a):n(t)}function a(e){return r.parser.lazy[r.now().line]?n(e):t(e)}}function dr(e,t,n){return r;function r(r){return e.enter(`lineEnding`),e.consume(r),e.exit(`lineEnding`),e.attempt(pn,t,n)}}var fr={name:`htmlText`,tokenize:pr};function pr(e,t,n){let r=this,i,a,o;return s;function s(t){return e.enter(`htmlText`),e.enter(`htmlTextData`),e.consume(t),c}function c(t){return t===33?(e.consume(t),l):t===47?(e.consume(t),x):t===63?(e.consume(t),y):Vt(t)?(e.consume(t),w):n(t)}function l(t){return t===45?(e.consume(t),u):t===91?(e.consume(t),a=0,m):Vt(t)?(e.consume(t),v):n(t)}function u(t){return t===45?(e.consume(t),p):n(t)}function d(t){return t===null?n(t):t===45?(e.consume(t),f):P(t)?(o=d,ae(t)):(e.consume(t),d)}function f(t){return t===45?(e.consume(t),p):d(t)}function p(e){return e===62?ie(e):e===45?f(e):d(e)}function m(t){return t===`CDATA[`.charCodeAt(a++)?(e.consume(t),a===6?h:m):n(t)}function h(t){return t===null?n(t):t===93?(e.consume(t),g):P(t)?(o=h,ae(t)):(e.consume(t),h)}function g(t){return t===93?(e.consume(t),_):h(t)}function _(t){return t===62?ie(t):t===93?(e.consume(t),_):h(t)}function v(t){return t===null||t===62?ie(t):P(t)?(o=v,ae(t)):(e.consume(t),v)}function y(t){return t===null?n(t):t===63?(e.consume(t),b):P(t)?(o=y,ae(t)):(e.consume(t),y)}function b(e){return e===62?ie(e):y(e)}function x(t){return Vt(t)?(e.consume(t),S):n(t)}function S(t){return t===45||Ht(t)?(e.consume(t),S):C(t)}function C(t){return P(t)?(o=C,ae(t)):I(t)?(e.consume(t),C):ie(t)}function w(t){return t===45||Ht(t)?(e.consume(t),w):t===47||t===62||F(t)?T(t):n(t)}function T(t){return t===47?(e.consume(t),ie):t===58||t===95||Vt(t)?(e.consume(t),E):P(t)?(o=T,ae(t)):I(t)?(e.consume(t),T):ie(t)}function E(t){return t===45||t===46||t===58||t===95||Ht(t)?(e.consume(t),E):ee(t)}function ee(t){return t===61?(e.consume(t),D):P(t)?(o=ee,ae(t)):I(t)?(e.consume(t),ee):T(t)}function D(t){return t===null||t===60||t===61||t===62||t===96?n(t):t===34||t===39?(e.consume(t),i=t,te):P(t)?(o=D,ae(t)):I(t)?(e.consume(t),D):(e.consume(t),ne)}function te(t){return t===i?(e.consume(t),i=void 0,re):t===null?n(t):P(t)?(o=te,ae(t)):(e.consume(t),te)}function ne(t){return t===null||t===34||t===39||t===60||t===61||t===96?n(t):t===47||t===62||F(t)?T(t):(e.consume(t),ne)}function re(e){return e===47||e===62||F(e)?T(e):n(e)}function ie(r){return r===62?(e.consume(r),e.exit(`htmlTextData`),e.exit(`htmlText`),t):n(r)}function ae(t){return e.exit(`htmlTextData`),e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),oe}function oe(t){return I(t)?L(e,se,`linePrefix`,r.parser.constructs.disable.null.includes(`codeIndented`)?void 0:4)(t):se(t)}function se(t){return e.enter(`htmlTextData`),o(t)}}var mr={name:`labelEnd`,resolveAll:vr,resolveTo:yr,tokenize:br},hr={tokenize:xr},gr={tokenize:Sr},_r={tokenize:Cr};function vr(e){let t=-1,n=[];for(;++t<e.length;){let r=e[t][1];if(n.push(e[t]),r.type===`labelImage`||r.type===`labelLink`||r.type===`labelEnd`){let e=r.type===`labelImage`?4:2;r.type=`data`,t+=e}}return e.length!==n.length&&Nt(e,0,e.length,n),e}function yr(e,t){let n=e.length,r=0,i,a,o,s;for(;n--;)if(i=e[n][1],a){if(i.type===`link`||i.type===`labelLink`&&i._inactive)break;e[n][0]===`enter`&&i.type===`labelLink`&&(i._inactive=!0)}else if(o){if(e[n][0]===`enter`&&(i.type===`labelImage`||i.type===`labelLink`)&&!i._balanced&&(a=n,i.type!==`labelLink`)){r=2;break}}else i.type===`labelEnd`&&(o=n);let c={type:e[a][1].type===`labelLink`?`link`:`image`,start:{...e[a][1].start},end:{...e[e.length-1][1].end}},l={type:`label`,start:{...e[a][1].start},end:{...e[o][1].end}},u={type:`labelText`,start:{...e[a+r+2][1].end},end:{...e[o-2][1].start}};return s=[[`enter`,c,t],[`enter`,l,t]],s=Pt(s,e.slice(a+1,a+r+3)),s=Pt(s,[[`enter`,u,t]]),s=Pt(s,on(t.parser.constructs.insideSpan.null,e.slice(a+r+4,o-3),t)),s=Pt(s,[[`exit`,u,t],e[o-2],e[o-1],[`exit`,l,t]]),s=Pt(s,e.slice(o+1)),s=Pt(s,[[`exit`,c,t]]),Nt(e,a,e.length,s),e}function br(e,t,n){let r=this,i=r.events.length,a,o;for(;i--;)if((r.events[i][1].type===`labelImage`||r.events[i][1].type===`labelLink`)&&!r.events[i][1]._balanced){a=r.events[i][1];break}return s;function s(t){return a?a._inactive?d(t):(o=r.parser.defined.includes(Bt(r.sliceSerialize({start:a.end,end:r.now()}))),e.enter(`labelEnd`),e.enter(`labelMarker`),e.consume(t),e.exit(`labelMarker`),e.exit(`labelEnd`),c):n(t)}function c(t){return t===40?e.attempt(hr,u,o?u:d)(t):t===91?e.attempt(gr,u,o?l:d)(t):o?u(t):d(t)}function l(t){return e.attempt(_r,u,d)(t)}function u(e){return t(e)}function d(e){return a._balanced=!0,n(e)}}function xr(e,t,n){return r;function r(t){return e.enter(`resource`),e.enter(`resourceMarker`),e.consume(t),e.exit(`resourceMarker`),i}function i(t){return F(t)?qn(e,a)(t):a(t)}function a(t){return t===41?u(t):Wn(e,o,s,`resourceDestination`,`resourceDestinationLiteral`,`resourceDestinationLiteralMarker`,`resourceDestinationRaw`,`resourceDestinationString`,32)(t)}function o(t){return F(t)?qn(e,c)(t):u(t)}function s(e){return n(e)}function c(t){return t===34||t===39||t===40?Kn(e,l,n,`resourceTitle`,`resourceTitleMarker`,`resourceTitleString`)(t):u(t)}function l(t){return F(t)?qn(e,u)(t):u(t)}function u(r){return r===41?(e.enter(`resourceMarker`),e.consume(r),e.exit(`resourceMarker`),e.exit(`resource`),t):n(r)}}function Sr(e,t,n){let r=this;return i;function i(t){return Gn.call(r,e,a,o,`reference`,`referenceMarker`,`referenceString`)(t)}function a(e){return r.parser.defined.includes(Bt(r.sliceSerialize(r.events[r.events.length-1][1]).slice(1,-1)))?t(e):n(e)}function o(e){return n(e)}}function Cr(e,t,n){return r;function r(t){return e.enter(`reference`),e.enter(`referenceMarker`),e.consume(t),e.exit(`referenceMarker`),i}function i(r){return r===93?(e.enter(`referenceMarker`),e.consume(r),e.exit(`referenceMarker`),e.exit(`reference`),t):n(r)}}var wr={name:`labelStartImage`,resolveAll:mr.resolveAll,tokenize:Tr};function Tr(e,t,n){let r=this;return i;function i(t){return e.enter(`labelImage`),e.enter(`labelImageMarker`),e.consume(t),e.exit(`labelImageMarker`),a}function a(t){return t===91?(e.enter(`labelMarker`),e.consume(t),e.exit(`labelMarker`),e.exit(`labelImage`),o):n(t)}function o(e){return e===94&&`_hiddenFootnoteSupport`in r.parser.constructs?n(e):t(e)}}var Er={name:`labelStartLink`,resolveAll:mr.resolveAll,tokenize:Dr};function Dr(e,t,n){let r=this;return i;function i(t){return e.enter(`labelLink`),e.enter(`labelMarker`),e.consume(t),e.exit(`labelMarker`),e.exit(`labelLink`),a}function a(e){return e===94&&`_hiddenFootnoteSupport`in r.parser.constructs?n(e):t(e)}}var Or={name:`lineEnding`,tokenize:kr};function kr(e,t){return n;function n(n){return e.enter(`lineEnding`),e.consume(n),e.exit(`lineEnding`),L(e,t,`linePrefix`)}}var Ar={name:`thematicBreak`,tokenize:jr};function jr(e,t,n){let r=0,i;return a;function a(t){return e.enter(`thematicBreak`),o(t)}function o(e){return i=e,s(e)}function s(a){return a===i?(e.enter(`thematicBreakSequence`),c(a)):r>=3&&(a===null||P(a))?(e.exit(`thematicBreak`),t(a)):n(a)}function c(t){return t===i?(e.consume(t),r++,c):(e.exit(`thematicBreakSequence`),I(t)?L(e,s,`whitespace`)(t):s(t))}}var Mr={continuation:{tokenize:Ir},exit:Rr,name:`list`,tokenize:Fr},Nr={partial:!0,tokenize:zr},Pr={partial:!0,tokenize:Lr};function Fr(e,t,n){let r=this,i=r.events[r.events.length-1],a=i&&i[1].type===`linePrefix`?i[2].sliceSerialize(i[1],!0).length:0,o=0;return s;function s(t){let i=r.containerState.type||(t===42||t===43||t===45?`listUnordered`:`listOrdered`);if(i===`listUnordered`?!r.containerState.marker||t===r.containerState.marker:Gt(t)){if(r.containerState.type||(r.containerState.type=i,e.enter(i,{_container:!0})),i===`listUnordered`)return e.enter(`listItemPrefix`),t===42||t===45?e.check(Ar,n,l)(t):l(t);if(!r.interrupt||t===49)return e.enter(`listItemPrefix`),e.enter(`listItemValue`),c(t)}return n(t)}function c(t){return Gt(t)&&++o<10?(e.consume(t),c):(!r.interrupt||o<2)&&(r.containerState.marker?t===r.containerState.marker:t===41||t===46)?(e.exit(`listItemValue`),l(t)):n(t)}function l(t){return e.enter(`listItemMarker`),e.consume(t),e.exit(`listItemMarker`),r.containerState.marker=r.containerState.marker||t,e.check(pn,r.interrupt?n:u,e.attempt(Nr,f,d))}function u(e){return r.containerState.initialBlankLine=!0,a++,f(e)}function d(t){return I(t)?(e.enter(`listItemPrefixWhitespace`),e.consume(t),e.exit(`listItemPrefixWhitespace`),f):n(t)}function f(n){return r.containerState.size=a+r.sliceSerialize(e.exit(`listItemPrefix`),!0).length,t(n)}}function Ir(e,t,n){let r=this;return r.containerState._closeFlow=void 0,e.check(pn,i,a);function i(n){return r.containerState.furtherBlankLines=r.containerState.furtherBlankLines||r.containerState.initialBlankLine,L(e,t,`listItemIndent`,r.containerState.size+1)(n)}function a(n){return r.containerState.furtherBlankLines||!I(n)?(r.containerState.furtherBlankLines=void 0,r.containerState.initialBlankLine=void 0,o(n)):(r.containerState.furtherBlankLines=void 0,r.containerState.initialBlankLine=void 0,e.attempt(Pr,t,o)(n))}function o(i){return r.containerState._closeFlow=!0,r.interrupt=void 0,L(e,e.attempt(Mr,t,n),`linePrefix`,r.parser.constructs.disable.null.includes(`codeIndented`)?void 0:4)(i)}}function Lr(e,t,n){let r=this;return L(e,i,`listItemIndent`,r.containerState.size+1);function i(e){let i=r.events[r.events.length-1];return i&&i[1].type===`listItemIndent`&&i[2].sliceSerialize(i[1],!0).length===r.containerState.size?t(e):n(e)}}function Rr(e){e.exit(this.containerState.type)}function zr(e,t,n){let r=this;return L(e,i,`listItemPrefixWhitespace`,r.parser.constructs.disable.null.includes(`codeIndented`)?void 0:5);function i(e){let i=r.events[r.events.length-1];return!I(e)&&i&&i[1].type===`listItemPrefixWhitespace`?t(e):n(e)}}var Br={name:`setextUnderline`,resolveTo:Vr,tokenize:Hr};function Vr(e,t){let n=e.length,r,i,a;for(;n--;)if(e[n][0]===`enter`){if(e[n][1].type===`content`){r=n;break}e[n][1].type===`paragraph`&&(i=n)}else e[n][1].type===`content`&&e.splice(n,1),!a&&e[n][1].type===`definition`&&(a=n);let o={type:`setextHeading`,start:{...e[r][1].start},end:{...e[e.length-1][1].end}};return e[i][1].type=`setextHeadingText`,a?(e.splice(i,0,[`enter`,o,t]),e.splice(a+1,0,[`exit`,e[r][1],t]),e[r][1].end={...e[a][1].end}):e[r][1]=o,e.push([`exit`,o,t]),e}function Hr(e,t,n){let r=this,i;return a;function a(t){let a=r.events.length,s;for(;a--;)if(r.events[a][1].type!==`lineEnding`&&r.events[a][1].type!==`linePrefix`&&r.events[a][1].type!==`content`){s=r.events[a][1].type===`paragraph`;break}return!r.parser.lazy[r.now().line]&&(r.interrupt||s)?(e.enter(`setextHeadingLine`),i=t,o(t)):n(t)}function o(t){return e.enter(`setextHeadingLineSequence`),s(t)}function s(t){return t===i?(e.consume(t),s):(e.exit(`setextHeadingLineSequence`),I(t)?L(e,c,`lineSuffix`)(t):c(t))}function c(r){return r===null||P(r)?(e.exit(`setextHeadingLine`),t(r)):n(r)}}var Ur={tokenize:Wr};function Wr(e){let t=this,n=e.attempt(pn,r,e.attempt(this.parser.constructs.flowInitial,i,L(e,e.attempt(this.parser.constructs.flow,i,e.attempt(zn,i)),`linePrefix`)));return n;function r(r){if(r===null){e.consume(r);return}return e.enter(`lineEndingBlank`),e.consume(r),e.exit(`lineEndingBlank`),t.currentConstruct=void 0,n}function i(r){if(r===null){e.consume(r);return}return e.enter(`lineEnding`),e.consume(r),e.exit(`lineEnding`),t.currentConstruct=void 0,n}}var Gr={resolveAll:Yr()},Kr=Jr(`string`),qr=Jr(`text`);function Jr(e){return{resolveAll:Yr(e===`text`?Xr:void 0),tokenize:t};function t(t){let n=this,r=this.parser.constructs[e],i=t.attempt(r,a,o);return a;function a(e){return c(e)?i(e):o(e)}function o(e){if(e===null){t.consume(e);return}return t.enter(`data`),t.consume(e),s}function s(e){return c(e)?(t.exit(`data`),i(e)):(t.consume(e),s)}function c(e){if(e===null)return!0;let t=r[e],i=-1;if(t)for(;++i<t.length;){let e=t[i];if(!e.previous||e.previous.call(n,n.previous))return!0}return!1}}}function Yr(e){return t;function t(t,n){let r=-1,i;for(;++r<=t.length;)i===void 0?t[r]&&t[r][1].type===`data`&&(i=r,r++):(!t[r]||t[r][1].type!==`data`)&&(r!==i+2&&(t[i][1].end=t[r-1][1].end,t.splice(i+2,r-i-2),r=i+2),i=void 0);return e?e(t,n):t}}function Xr(e,t){let n=0;for(;++n<=e.length;)if((n===e.length||e[n][1].type===`lineEnding`)&&e[n-1][1].type===`data`){let r=e[n-1][1],i=t.sliceStream(r),a=i.length,o=-1,s=0,c;for(;a--;){let e=i[a];if(typeof e==`string`){for(o=e.length;e.charCodeAt(o-1)===32;)s++,o--;if(o)break;o=-1}else if(e===-2)c=!0,s++;else if(e!==-1){a++;break}}if(t._contentTypeTextTrailing&&n===e.length&&(s=0),s){let i={type:n===e.length||c||s<2?`lineSuffix`:`hardBreakTrailing`,start:{_bufferIndex:a?o:r.start._bufferIndex+o,_index:r.start._index+a,line:r.end.line,column:r.end.column-s,offset:r.end.offset-s},end:{...r.end}};r.end={...i.start},r.start.offset===r.end.offset?Object.assign(r,i):(e.splice(n,0,[`enter`,i,t],[`exit`,i,t]),n+=2)}n++}return e}var Zr=s({attentionMarkers:()=>ai,contentInitial:()=>$r,disable:()=>oi,document:()=>Qr,flow:()=>ti,flowInitial:()=>ei,insideSpan:()=>ii,string:()=>ni,text:()=>ri}),Qr={42:Mr,43:Mr,45:Mr,48:Mr,49:Mr,50:Mr,51:Mr,52:Mr,53:Mr,54:Mr,55:Mr,56:Mr,57:Mr,62:hn},$r={91:Jn},ei={[-2]:Dn,[-1]:Dn,32:Dn},ti={35:er,42:Ar,45:[Br,Ar],60:ar,61:Br,95:Ar,96:wn,126:wn},ni={38:xn,92:yn},ri={[-5]:Or,[-4]:Or,[-3]:Or,33:wr,38:xn,42:sn,60:[dn,fr],91:Er,92:[Qn,yn],93:mr,95:sn,96:jn},ii={null:[sn,Gr]},ai={null:[42,95]},oi={null:[]};function si(e,t,n){let r={_bufferIndex:-1,_index:0,line:n&&n.line||1,column:n&&n.column||1,offset:n&&n.offset||0},i={},a=[],o=[],s=[],c={attempt:C(x),check:C(S),consume:v,enter:y,exit:b,interrupt:C(S,{interrupt:!0})},l={code:null,containerState:{},defineSkip:h,events:[],now:m,parser:e,previous:null,sliceSerialize:f,sliceStream:p,write:d},u=t.tokenize.call(l,c);return t.resolveAll&&a.push(t),l;function d(e){return o=Pt(o,e),g(),o[o.length-1]===null?(w(t,0),l.events=on(a,l.events,l),l.events):[]}function f(e,t){return li(p(e),t)}function p(e){return ci(o,e)}function m(){let{_bufferIndex:e,_index:t,line:n,column:i,offset:a}=r;return{_bufferIndex:e,_index:t,line:n,column:i,offset:a}}function h(e){i[e.line]=e.column,E()}function g(){let e;for(;r._index<o.length;){let t=o[r._index];if(typeof t==`string`)for(e=r._index,r._bufferIndex<0&&(r._bufferIndex=0);r._index===e&&r._bufferIndex<t.length;)_(t.charCodeAt(r._bufferIndex));else _(t)}}function _(e){u=u(e)}function v(e){P(e)?(r.line++,r.column=1,r.offset+=e===-3?2:1,E()):e!==-1&&(r.column++,r.offset++),r._bufferIndex<0?r._index++:(r._bufferIndex++,r._bufferIndex===o[r._index].length&&(r._bufferIndex=-1,r._index++)),l.previous=e}function y(e,t){let n=t||{};return n.type=e,n.start=m(),l.events.push([`enter`,n,l]),s.push(n),n}function b(e){let t=s.pop();return t.end=m(),l.events.push([`exit`,t,l]),t}function x(e,t){w(e,t.from)}function S(e,t){t.restore()}function C(e,t){return n;function n(n,r,i){let a,o,s,u;return Array.isArray(n)?f(n):`tokenize`in n?f([n]):d(n);function d(e){return t;function t(t){let n=t!==null&&e[t],r=t!==null&&e.null;return f([...Array.isArray(n)?n:n?[n]:[],...Array.isArray(r)?r:r?[r]:[]])(t)}}function f(e){return a=e,o=0,e.length===0?i:p(e[o])}function p(e){return n;function n(n){return u=T(),s=e,e.partial||(l.currentConstruct=e),e.name&&l.parser.constructs.disable.null.includes(e.name)?h(n):e.tokenize.call(t?Object.assign(Object.create(l),t):l,c,m,h)(n)}}function m(t){return e(s,u),r}function h(e){return u.restore(),++o<a.length?p(a[o]):i}}}function w(e,t){e.resolveAll&&!a.includes(e)&&a.push(e),e.resolve&&Nt(l.events,t,l.events.length-t,e.resolve(l.events.slice(t),l)),e.resolveTo&&(l.events=e.resolveTo(l.events,l))}function T(){let e=m(),t=l.previous,n=l.currentConstruct,i=l.events.length,a=Array.from(s);return{from:i,restore:o};function o(){r=e,l.previous=t,l.currentConstruct=n,l.events.length=i,s=a,E()}}function E(){r.line in i&&r.column<2&&(r.column=i[r.line],r.offset+=i[r.line]-1)}}function ci(e,t){let n=t.start._index,r=t.start._bufferIndex,i=t.end._index,a=t.end._bufferIndex,o;if(n===i)o=[e[n].slice(r,a)];else{if(o=e.slice(n,i),r>-1){let e=o[0];typeof e==`string`?o[0]=e.slice(r):o.shift()}a>0&&o.push(e[i].slice(0,a))}return o}function li(e,t){let n=-1,r=[],i;for(;++n<e.length;){let a=e[n],o;if(typeof a==`string`)o=a;else switch(a){case-5:o=`\r`;break;case-4:o=`
`;break;case-3:o=`\r
`;break;case-2:o=t?` `:`	`;break;case-1:if(!t&&i)continue;o=` `;break;default:o=String.fromCharCode(a)}i=a===-2,r.push(o)}return r.join(``)}function ui(e){let t={constructs:It([Zr,...(e||{}).extensions||[]]),content:n(Qt),defined:[],document:n(en),flow:n(Ur),lazy:{},string:n(Kr),text:n(qr)};return t;function n(e){return n;function n(n){return si(t,e,n)}}}function di(e){for(;!Ln(e););return e}var fi=/[\0\t\n\r]/g;function pi(){let e=1,t=``,n=!0,r;return i;function i(i,a,o){let s=[],c,l,u,d,f;for(i=t+(typeof i==`string`?i.toString():new TextDecoder(a||void 0).decode(i)),u=0,t=``,n&&=(i.charCodeAt(0)===65279&&u++,void 0);u<i.length;){if(fi.lastIndex=u,c=fi.exec(i),d=c&&c.index!==void 0?c.index:i.length,f=i.charCodeAt(d),!c){t=i.slice(u);break}if(f===10&&u===d&&r)s.push(-3),r=void 0;else switch(r&&=(s.push(-5),void 0),u<d&&(s.push(i.slice(u,d)),e+=d-u),f){case 0:s.push(65533),e++;break;case 9:for(l=Math.ceil(e/4)*4,s.push(-2);e++<l;)s.push(-1);break;case 10:s.push(-4),e=1;break;default:r=!0,e=1}u=d+1}return o&&(r&&s.push(-5),t&&s.push(t),s.push(null)),s}}var mi=/\\([!-/:-@[-`{-~])|&(#(?:\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi;function hi(e){return e.replace(mi,gi)}function gi(e,t,n){if(t)return t;if(n.charCodeAt(0)===35){let e=n.charCodeAt(1),t=e===120||e===88;return zt(n.slice(t?2:1),t?16:10)}return Mt(n)||e}var _i={}.hasOwnProperty;function vi(e,t,n){return t&&typeof t==`object`&&(n=t,t=void 0),yi(n)(di(ui(n).document().write(pi()(e,t,!0))))}function yi(e){let t={transforms:[],canContainEols:[`emphasis`,`fragment`,`heading`,`paragraph`,`strong`],enter:{autolink:a(xe),autolinkProtocol:T,autolinkEmail:T,atxHeading:a(_e),blockQuote:a(N),characterEscape:T,characterReference:T,codeFenced:a(pe),codeFencedFenceInfo:o,codeFencedFenceMeta:o,codeIndented:a(pe,o),codeText:a(me,o),codeTextData:T,data:T,codeFlowValue:T,definition:a(he),definitionDestinationString:o,definitionLabelString:o,definitionTitleString:o,emphasis:a(ge),hardBreakEscape:a(ve),hardBreakTrailing:a(ve),htmlFlow:a(ye,o),htmlFlowData:T,htmlText:a(ye,o),htmlTextData:T,image:a(be),label:o,link:a(xe),listItem:a(Ce),listItemValue:f,listOrdered:a(Se,d),listUnordered:a(Se),paragraph:a(we),reference:le,referenceString:o,resourceDestinationString:o,resourceTitleString:o,setextHeading:a(_e),strong:a(Te),thematicBreak:a(De)},exit:{atxHeading:c(),atxHeadingSequence:x,autolink:c(),autolinkEmail:M,autolinkProtocol:fe,blockQuote:c(),characterEscapeValue:E,characterReferenceMarkerHexadecimal:de,characterReferenceMarkerNumeric:de,characterReferenceValue:A,characterReference:j,codeFenced:c(g),codeFencedFence:h,codeFencedFenceInfo:p,codeFencedFenceMeta:m,codeFlowValue:E,codeIndented:c(_),codeText:c(re),codeTextData:E,data:E,definition:c(),definitionDestinationString:b,definitionLabelString:v,definitionTitleString:y,emphasis:c(),hardBreakEscape:c(D),hardBreakTrailing:c(D),htmlFlow:c(te),htmlFlowData:E,htmlText:c(ne),htmlTextData:E,image:c(ae),label:se,labelText:oe,lineEnding:ee,link:c(ie),listItem:c(),listOrdered:c(),listUnordered:c(),paragraph:c(),referenceString:ue,resourceDestinationString:O,resourceTitleString:k,resource:ce,setextHeading:c(w),setextHeadingLineSequence:C,setextHeadingText:S,strong:c(),thematicBreak:c()}};xi(t,(e||{}).mdastExtensions||[]);let n={};return r;function r(e){let r={type:`root`,children:[]},a={stack:[r],tokenStack:[],config:t,enter:s,exit:l,buffer:o,resume:u,data:n},c=[],d=-1;for(;++d<e.length;)(e[d][1].type===`listOrdered`||e[d][1].type===`listUnordered`)&&(e[d][0]===`enter`?c.push(d):d=i(e,c.pop(),d));for(d=-1;++d<e.length;){let n=t[e[d][0]];_i.call(n,e[d][1].type)&&n[e[d][1].type].call(Object.assign({sliceSerialize:e[d][2].sliceSerialize},a),e[d][1])}if(a.tokenStack.length>0){let e=a.tokenStack[a.tokenStack.length-1];(e[1]||Ci).call(a,void 0,e[0])}for(r.position={start:bi(e.length>0?e[0][1].start:{line:1,column:1,offset:0}),end:bi(e.length>0?e[e.length-2][1].end:{line:1,column:1,offset:0})},d=-1;++d<t.transforms.length;)r=t.transforms[d](r)||r;return r}function i(e,t,n){let r=t-1,i=-1,a=!1,o,s,c,l;for(;++r<=n;){let t=e[r];switch(t[1].type){case`listUnordered`:case`listOrdered`:case`blockQuote`:t[0]===`enter`?i++:i--,l=void 0;break;case`lineEndingBlank`:t[0]===`enter`&&(o&&!l&&!i&&!c&&(c=r),l=void 0);break;case`linePrefix`:case`listItemValue`:case`listItemMarker`:case`listItemPrefix`:case`listItemPrefixWhitespace`:break;default:l=void 0}if(!i&&t[0]===`enter`&&t[1].type===`listItemPrefix`||i===-1&&t[0]===`exit`&&(t[1].type===`listUnordered`||t[1].type===`listOrdered`)){if(o){let i=r;for(s=void 0;i--;){let t=e[i];if(t[1].type===`lineEnding`||t[1].type===`lineEndingBlank`){if(t[0]===`exit`)continue;s&&(e[s][1].type=`lineEndingBlank`,a=!0),t[1].type=`lineEnding`,s=i}else if(!(t[1].type===`linePrefix`||t[1].type===`blockQuotePrefix`||t[1].type===`blockQuotePrefixWhitespace`||t[1].type===`blockQuoteMarker`||t[1].type===`listItemIndent`))break}c&&(!s||c<s)&&(o._spread=!0),o.end=Object.assign({},s?e[s][1].start:t[1].end),e.splice(s||r,0,[`exit`,o,t[2]]),r++,n++}if(t[1].type===`listItemPrefix`){let i={type:`listItem`,_spread:!1,start:Object.assign({},t[1].start),end:void 0};o=i,e.splice(r,0,[`enter`,i,t[2]]),r++,n++,c=void 0,l=!0}}}return e[t][1]._spread=a,n}function a(e,t){return n;function n(n){s.call(this,e(n),n),t&&t.call(this,n)}}function o(){this.stack.push({type:`fragment`,children:[]})}function s(e,t,n){this.stack[this.stack.length-1].children.push(e),this.stack.push(e),this.tokenStack.push([t,n||void 0]),e.position={start:bi(t.start),end:void 0}}function c(e){return t;function t(t){e&&e.call(this,t),l.call(this,t)}}function l(e,t){let n=this.stack.pop(),r=this.tokenStack.pop();if(r)r[0].type!==e.type&&(t?t.call(this,e,r[0]):(r[1]||Ci).call(this,e,r[0]));else throw Error("Cannot close `"+e.type+"` ("+Ke({start:e.start,end:e.end})+`): it’s not open`);n.position.end=bi(e.end)}function u(){return Dt(this.stack.pop())}function d(){this.data.expectingFirstListItemValue=!0}function f(e){if(this.data.expectingFirstListItemValue){let t=this.stack[this.stack.length-2];t.start=Number.parseInt(this.sliceSerialize(e),10),this.data.expectingFirstListItemValue=void 0}}function p(){let e=this.resume(),t=this.stack[this.stack.length-1];t.lang=e}function m(){let e=this.resume(),t=this.stack[this.stack.length-1];t.meta=e}function h(){this.data.flowCodeInside||(this.buffer(),this.data.flowCodeInside=!0)}function g(){let e=this.resume(),t=this.stack[this.stack.length-1];t.value=e.replace(/^(\r?\n|\r)|(\r?\n|\r)$/g,``),this.data.flowCodeInside=void 0}function _(){let e=this.resume(),t=this.stack[this.stack.length-1];t.value=e.replace(/(\r?\n|\r)$/g,``)}function v(e){let t=this.resume(),n=this.stack[this.stack.length-1];n.label=t,n.identifier=Bt(this.sliceSerialize(e)).toLowerCase()}function y(){let e=this.resume(),t=this.stack[this.stack.length-1];t.title=e}function b(){let e=this.resume(),t=this.stack[this.stack.length-1];t.url=e}function x(e){let t=this.stack[this.stack.length-1];t.depth||=this.sliceSerialize(e).length}function S(){this.data.setextHeadingSlurpLineEnding=!0}function C(e){let t=this.stack[this.stack.length-1];t.depth=this.sliceSerialize(e).codePointAt(0)===61?1:2}function w(){this.data.setextHeadingSlurpLineEnding=void 0}function T(e){let t=this.stack[this.stack.length-1].children,n=t[t.length-1];(!n||n.type!==`text`)&&(n=Ee(),n.position={start:bi(e.start),end:void 0},t.push(n)),this.stack.push(n)}function E(e){let t=this.stack.pop();t.value+=this.sliceSerialize(e),t.position.end=bi(e.end)}function ee(e){let n=this.stack[this.stack.length-1];if(this.data.atHardBreak){let t=n.children[n.children.length-1];t.position.end=bi(e.end),this.data.atHardBreak=void 0;return}!this.data.setextHeadingSlurpLineEnding&&t.canContainEols.includes(n.type)&&(T.call(this,e),E.call(this,e))}function D(){this.data.atHardBreak=!0}function te(){let e=this.resume(),t=this.stack[this.stack.length-1];t.value=e}function ne(){let e=this.resume(),t=this.stack[this.stack.length-1];t.value=e}function re(){let e=this.resume(),t=this.stack[this.stack.length-1];t.value=e}function ie(){let e=this.stack[this.stack.length-1];if(this.data.inReference){let t=this.data.referenceType||`shortcut`;e.type+=`Reference`,e.referenceType=t,delete e.url,delete e.title}else delete e.identifier,delete e.label;this.data.referenceType=void 0}function ae(){let e=this.stack[this.stack.length-1];if(this.data.inReference){let t=this.data.referenceType||`shortcut`;e.type+=`Reference`,e.referenceType=t,delete e.url,delete e.title}else delete e.identifier,delete e.label;this.data.referenceType=void 0}function oe(e){let t=this.sliceSerialize(e),n=this.stack[this.stack.length-2];n.label=hi(t),n.identifier=Bt(t).toLowerCase()}function se(){let e=this.stack[this.stack.length-1],t=this.resume(),n=this.stack[this.stack.length-1];this.data.inReference=!0,n.type===`link`?n.children=e.children:n.alt=t}function O(){let e=this.resume(),t=this.stack[this.stack.length-1];t.url=e}function k(){let e=this.resume(),t=this.stack[this.stack.length-1];t.title=e}function ce(){this.data.inReference=void 0}function le(){this.data.referenceType=`collapsed`}function ue(e){let t=this.resume(),n=this.stack[this.stack.length-1];n.label=t,n.identifier=Bt(this.sliceSerialize(e)).toLowerCase(),this.data.referenceType=`full`}function de(e){this.data.characterReferenceType=e.type}function A(e){let t=this.sliceSerialize(e),n=this.data.characterReferenceType,r;n?(r=zt(t,n===`characterReferenceMarkerNumeric`?10:16),this.data.characterReferenceType=void 0):r=Mt(t);let i=this.stack[this.stack.length-1];i.value+=r}function j(e){let t=this.stack.pop();t.position.end=bi(e.end)}function fe(e){E.call(this,e);let t=this.stack[this.stack.length-1];t.url=this.sliceSerialize(e)}function M(e){E.call(this,e);let t=this.stack[this.stack.length-1];t.url=`mailto:`+this.sliceSerialize(e)}function N(){return{type:`blockquote`,children:[]}}function pe(){return{type:`code`,lang:null,meta:null,value:``}}function me(){return{type:`inlineCode`,value:``}}function he(){return{type:`definition`,identifier:``,label:null,title:null,url:``}}function ge(){return{type:`emphasis`,children:[]}}function _e(){return{type:`heading`,depth:0,children:[]}}function ve(){return{type:`break`}}function ye(){return{type:`html`,value:``}}function be(){return{type:`image`,title:null,url:``,alt:null}}function xe(){return{type:`link`,title:null,url:``,children:[]}}function Se(e){return{type:`list`,ordered:e.type===`listOrdered`,start:null,spread:e._spread,children:[]}}function Ce(e){return{type:`listItem`,spread:e._spread,checked:null,children:[]}}function we(){return{type:`paragraph`,children:[]}}function Te(){return{type:`strong`,children:[]}}function Ee(){return{type:`text`,value:``}}function De(){return{type:`thematicBreak`}}}function bi(e){return{line:e.line,column:e.column,offset:e.offset}}function xi(e,t){let n=-1;for(;++n<t.length;){let r=t[n];Array.isArray(r)?xi(e,r):Si(e,r)}}function Si(e,t){let n;for(n in t)if(_i.call(t,n))switch(n){case`canContainEols`:{let r=t[n];r&&e[n].push(...r);break}case`transforms`:{let r=t[n];r&&e[n].push(...r);break}case`enter`:case`exit`:{let r=t[n];r&&Object.assign(e[n],r);break}}}function Ci(e,t){throw Error(e?"Cannot close `"+e.type+"` ("+Ke({start:e.start,end:e.end})+"): a different token (`"+t.type+"`, "+Ke({start:t.start,end:t.end})+`) is open`:"Cannot close document, a token (`"+t.type+"`, "+Ke({start:t.start,end:t.end})+`) is still open`)}function wi(e){let t=this;t.parser=n;function n(n){return vi(n,{...t.data(`settings`),...e,extensions:t.data(`micromarkExtensions`)||[],mdastExtensions:t.data(`fromMarkdownExtensions`)||[]})}}function Ti(e,t){let n={type:`element`,tagName:`blockquote`,properties:{},children:e.wrap(e.all(t),!0)};return e.patch(t,n),e.applyData(t,n)}function Ei(e,t){let n={type:`element`,tagName:`br`,properties:{},children:[]};return e.patch(t,n),[e.applyData(t,n),{type:`text`,value:`
`}]}function Di(e,t){let n=t.value?t.value+`
`:``,r={},i=t.lang?t.lang.split(/\s+/):[];i.length>0&&(r.className=[`language-`+i[0]]);let a={type:`element`,tagName:`code`,properties:r,children:[{type:`text`,value:n}]};return t.meta&&(a.data={meta:t.meta}),e.patch(t,a),a=e.applyData(t,a),a={type:`element`,tagName:`pre`,properties:{},children:[a]},e.patch(t,a),a}function Oi(e,t){let n={type:`element`,tagName:`del`,properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function ki(e,t){let n={type:`element`,tagName:`em`,properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function Ai(e,t){let n=typeof e.options.clobberPrefix==`string`?e.options.clobberPrefix:`user-content-`,r=String(t.identifier).toUpperCase(),i=Zt(r.toLowerCase()),a=e.footnoteOrder.indexOf(r),o,s=e.footnoteCounts.get(r);s===void 0?(s=0,e.footnoteOrder.push(r),o=e.footnoteOrder.length):o=a+1,s+=1,e.footnoteCounts.set(r,s);let c={type:`element`,tagName:`a`,properties:{href:`#`+n+`fn-`+i,id:n+`fnref-`+i+(s>1?`-`+s:``),dataFootnoteRef:!0,ariaDescribedBy:[`footnote-label`]},children:[{type:`text`,value:String(o)}]};e.patch(t,c);let l={type:`element`,tagName:`sup`,properties:{},children:[c]};return e.patch(t,l),e.applyData(t,l)}function ji(e,t){let n={type:`element`,tagName:`h`+t.depth,properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function Mi(e,t){if(e.options.allowDangerousHtml){let n={type:`raw`,value:t.value};return e.patch(t,n),e.applyData(t,n)}}function Ni(e,t){let n=t.referenceType,r=`]`;if(n===`collapsed`?r+=`[]`:n===`full`&&(r+=`[`+(t.label||t.identifier)+`]`),t.type===`imageReference`)return[{type:`text`,value:`![`+t.alt+r}];let i=e.all(t),a=i[0];a&&a.type===`text`?a.value=`[`+a.value:i.unshift({type:`text`,value:`[`});let o=i[i.length-1];return o&&o.type===`text`?o.value+=r:i.push({type:`text`,value:r}),i}function Pi(e,t){let n=String(t.identifier).toUpperCase(),r=e.definitionById.get(n);if(!r)return Ni(e,t);let i={src:Zt(r.url||``),alt:t.alt};r.title!==null&&r.title!==void 0&&(i.title=r.title);let a={type:`element`,tagName:`img`,properties:i,children:[]};return e.patch(t,a),e.applyData(t,a)}function R(e,t){let n={src:Zt(t.url)};t.alt!==null&&t.alt!==void 0&&(n.alt=t.alt),t.title!==null&&t.title!==void 0&&(n.title=t.title);let r={type:`element`,tagName:`img`,properties:n,children:[]};return e.patch(t,r),e.applyData(t,r)}function z(e,t){let n={type:`text`,value:t.value.replace(/\r?\n|\r/g,` `)};e.patch(t,n);let r={type:`element`,tagName:`code`,properties:{},children:[n]};return e.patch(t,r),e.applyData(t,r)}function Fi(e,t){let n=String(t.identifier).toUpperCase(),r=e.definitionById.get(n);if(!r)return Ni(e,t);let i={href:Zt(r.url||``)};r.title!==null&&r.title!==void 0&&(i.title=r.title);let a={type:`element`,tagName:`a`,properties:i,children:e.all(t)};return e.patch(t,a),e.applyData(t,a)}function Ii(e,t){let n={href:Zt(t.url)};t.title!==null&&t.title!==void 0&&(n.title=t.title);let r={type:`element`,tagName:`a`,properties:n,children:e.all(t)};return e.patch(t,r),e.applyData(t,r)}function Li(e,t,n){let r=e.all(t),i=n?Ri(n):zi(t),a={},o=[];if(typeof t.checked==`boolean`){let e=r[0],n;e&&e.type===`element`&&e.tagName===`p`?n=e:(n={type:`element`,tagName:`p`,properties:{},children:[]},r.unshift(n)),n.children.length>0&&n.children.unshift({type:`text`,value:` `}),n.children.unshift({type:`element`,tagName:`input`,properties:{type:`checkbox`,checked:t.checked,disabled:!0},children:[]}),a.className=[`task-list-item`]}let s=-1;for(;++s<r.length;){let e=r[s];(i||s!==0||e.type!==`element`||e.tagName!==`p`)&&o.push({type:`text`,value:`
`}),e.type===`element`&&e.tagName===`p`&&!i?o.push(...e.children):o.push(e)}let c=r[r.length-1];c&&(i||c.type!==`element`||c.tagName!==`p`)&&o.push({type:`text`,value:`
`});let l={type:`element`,tagName:`li`,properties:a,children:o};return e.patch(t,l),e.applyData(t,l)}function Ri(e){let t=!1;if(e.type===`list`){t=e.spread||!1;let n=e.children,r=-1;for(;!t&&++r<n.length;)t=zi(n[r])}return t}function zi(e){return e.spread??e.children.length>1}function Bi(e,t){let n={},r=e.all(t),i=-1;for(typeof t.start==`number`&&t.start!==1&&(n.start=t.start);++i<r.length;){let e=r[i];if(e.type===`element`&&e.tagName===`li`&&e.properties&&Array.isArray(e.properties.className)&&e.properties.className.includes(`task-list-item`)){n.className=[`contains-task-list`];break}}let a={type:`element`,tagName:t.ordered?`ol`:`ul`,properties:n,children:e.wrap(r,!0)};return e.patch(t,a),e.applyData(t,a)}function Vi(e,t){let n={type:`element`,tagName:`p`,properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function Hi(e,t){let n={type:`root`,children:e.wrap(e.all(t))};return e.patch(t,n),e.applyData(t,n)}function Ui(e,t){let n={type:`element`,tagName:`strong`,properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function Wi(e,t){let n=e.all(t),r=n.shift(),i=[];if(r){let n={type:`element`,tagName:`thead`,properties:{},children:e.wrap([r],!0)};e.patch(t.children[0],n),i.push(n)}if(n.length>0){let r={type:`element`,tagName:`tbody`,properties:{},children:e.wrap(n,!0)},a=Ue(t.children[1]),o=He(t.children[t.children.length-1]);a&&o&&(r.position={start:a,end:o}),i.push(r)}let a={type:`element`,tagName:`table`,properties:{},children:e.wrap(i,!0)};return e.patch(t,a),e.applyData(t,a)}function Gi(e,t,n){let r=n?n.children:void 0,i=(r?r.indexOf(t):1)===0?`th`:`td`,a=n&&n.type===`table`?n.align:void 0,o=a?a.length:t.children.length,s=-1,c=[];for(;++s<o;){let n=t.children[s],r={},o=a?a[s]:void 0;o&&(r.align=o);let l={type:`element`,tagName:i,properties:r,children:[]};n&&(l.children=e.all(n),e.patch(n,l),l=e.applyData(n,l)),c.push(l)}let l={type:`element`,tagName:`tr`,properties:{},children:e.wrap(c,!0)};return e.patch(t,l),e.applyData(t,l)}function Ki(e,t){let n={type:`element`,tagName:`td`,properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}var qi=9,Ji=32;function Yi(e){let t=String(e),n=/\r?\n|\r/g,r=n.exec(t),i=0,a=[];for(;r;)a.push(Xi(t.slice(i,r.index),i>0,!0),r[0]),i=r.index+r[0].length,r=n.exec(t);return a.push(Xi(t.slice(i),i>0,!1)),a.join(``)}function Xi(e,t,n){let r=0,i=e.length;if(t){let t=e.codePointAt(r);for(;t===qi||t===Ji;)r++,t=e.codePointAt(r)}if(n){let t=e.codePointAt(i-1);for(;t===qi||t===Ji;)i--,t=e.codePointAt(i-1)}return i>r?e.slice(r,i):``}function Zi(e,t){let n={type:`text`,value:Yi(String(t.value))};return e.patch(t,n),e.applyData(t,n)}function Qi(e,t){let n={type:`element`,tagName:`hr`,properties:{},children:[]};return e.patch(t,n),e.applyData(t,n)}var $i={blockquote:Ti,break:Ei,code:Di,delete:Oi,emphasis:ki,footnoteReference:Ai,heading:ji,html:Mi,imageReference:Pi,image:R,inlineCode:z,linkReference:Fi,link:Ii,listItem:Li,list:Bi,paragraph:Vi,root:Hi,strong:Ui,table:Wi,tableCell:Ki,tableRow:Gi,text:Zi,thematicBreak:Qi,toml:ea,yaml:ea,definition:ea,footnoteDefinition:ea};function ea(){}var ta=typeof self==`object`?self:globalThis,na=(e,t)=>{switch(e){case`Function`:case`SharedWorker`:case`Worker`:case`eval`:case`setInterval`:case`setTimeout`:throw TypeError(`unable to deserialize `+e)}return new ta[e](t)},ra=(e,t)=>{let n=(t,n)=>(e.set(n,t),t),r=i=>{if(e.has(i))return e.get(i);let[a,o]=t[i];switch(a){case 0:case-1:return n(o,i);case 1:{let e=n([],i);for(let t of o)e.push(r(t));return e}case 2:{let e=n({},i);for(let[t,n]of o)e[r(t)]=r(n);return e}case 3:return n(new Date(o),i);case 4:{let{source:e,flags:t}=o;return n(new RegExp(e,t),i)}case 5:{let e=n(new Map,i);for(let[t,n]of o)e.set(r(t),r(n));return e}case 6:{let e=n(new Set,i);for(let t of o)e.add(r(t));return e}case 7:{let{name:e,message:t}=o;return n(typeof ta[e]==`function`?na(e,t):Error(t),i)}case 8:return n(BigInt(o),i);case`BigInt`:return n(Object(BigInt(o)),i);case`ArrayBuffer`:return n(new Uint8Array(o).buffer,o);case`DataView`:{let{buffer:e}=new Uint8Array(o);return n(new DataView(e),o)}}return n(na(a,o),i)};return r},ia=e=>ra(new Map,e)(0),aa=``,{toString:oa}={},{keys:sa}=Object,ca=e=>{let t=typeof e;if(t!==`object`||!e)return[0,t];let n=oa.call(e).slice(8,-1);switch(n){case`Array`:return[1,aa];case`Object`:return[2,aa];case`Date`:return[3,aa];case`RegExp`:return[4,aa];case`Map`:return[5,aa];case`Set`:return[6,aa];case`DataView`:return[1,n]}return n.includes(`Array`)?[1,n]:e instanceof Error?[7,e.name||`Error`]:[2,n]},la=([e,t])=>e===0&&(t===`function`||t===`symbol`),ua=(e,t,n,r)=>{let i=(e,t)=>{let i=r.push(e)-1;return n.set(t,i),i},a=r=>{if(n.has(r))return n.get(r);let[o,s]=ca(r);switch(o){case 0:{let t=r;switch(s){case`bigint`:o=8,t=r.toString();break;case`function`:case`symbol`:if(e)throw TypeError(`unable to serialize `+s);t=null;break;case`undefined`:return i([-1],r)}return i([o,t],r)}case 1:{if(s){let e=r;return s===`DataView`?e=new Uint8Array(r.buffer):s===`ArrayBuffer`&&(e=new Uint8Array(r)),i([s,[...e]],r)}let e=[],t=i([o,e],r);for(let t of r)e.push(a(t));return t}case 2:{if(s)switch(s){case`BigInt`:return i([s,r.toString()],r);case`Boolean`:case`Number`:case`String`:return i([s,r.valueOf()],r)}if(t&&`toJSON`in r)return a(r.toJSON());let n=[],c=i([o,n],r);for(let t of sa(r))(e||!la(ca(r[t])))&&n.push([a(t),a(r[t])]);return c}case 3:return i([o,isNaN(r.getTime())?aa:r.toISOString()],r);case 4:{let{source:e,flags:t}=r;return i([o,{source:e,flags:t}],r)}case 5:{let t=[],n=i([o,t],r);for(let[n,i]of r)(e||!(la(ca(n))||la(ca(i))))&&t.push([a(n),a(i)]);return n}case 6:{let t=[],n=i([o,t],r);for(let n of r)(e||!la(ca(n)))&&t.push(a(n));return n}}let{message:c}=r;return i([o,{name:s,message:c}],r)};return a},da=(e,{json:t,lossy:n}={})=>{let r=[];return ua(!(t||n),!!t,new Map,r)(e),r},fa=typeof structuredClone==`function`?(e,t)=>t&&(`json`in t||`lossy`in t)?ia(da(e,t)):structuredClone(e):(e,t)=>ia(da(e,t));function pa(e,t){let n=[{type:`text`,value:`↩`}];return t>1&&n.push({type:`element`,tagName:`sup`,properties:{},children:[{type:`text`,value:String(t)}]}),n}function ma(e,t){return`Back to reference `+(e+1)+(t>1?`-`+t:``)}function ha(e){let t=typeof e.options.clobberPrefix==`string`?e.options.clobberPrefix:`user-content-`,n=e.options.footnoteBackContent||pa,r=e.options.footnoteBackLabel||ma,i=e.options.footnoteLabel||`Footnotes`,a=e.options.footnoteLabelTagName||`h2`,o=e.options.footnoteLabelProperties||{className:[`sr-only`]},s=[],c=-1;for(;++c<e.footnoteOrder.length;){let i=e.footnoteById.get(e.footnoteOrder[c]);if(!i)continue;let a=e.all(i),o=String(i.identifier).toUpperCase(),l=Zt(o.toLowerCase()),u=0,d=[],f=e.footnoteCounts.get(o);for(;f!==void 0&&++u<=f;){d.length>0&&d.push({type:`text`,value:` `});let e=typeof n==`string`?n:n(c,u);typeof e==`string`&&(e={type:`text`,value:e}),d.push({type:`element`,tagName:`a`,properties:{href:`#`+t+`fnref-`+l+(u>1?`-`+u:``),dataFootnoteBackref:``,ariaLabel:typeof r==`string`?r:r(c,u),className:[`data-footnote-backref`]},children:Array.isArray(e)?e:[e]})}let p=a[a.length-1];if(p&&p.type===`element`&&p.tagName===`p`){let e=p.children[p.children.length-1];e&&e.type===`text`?e.value+=` `:p.children.push({type:`text`,value:` `}),p.children.push(...d)}else a.push(...d);let m={type:`element`,tagName:`li`,properties:{id:t+`fn-`+l},children:e.wrap(a,!0)};e.patch(i,m),s.push(m)}if(s.length!==0)return{type:`element`,tagName:`section`,properties:{dataFootnotes:!0,className:[`footnotes`]},children:[{type:`element`,tagName:a,properties:{...fa(o),id:`footnote-label`},children:[{type:`text`,value:i}]},{type:`text`,value:`
`},{type:`element`,tagName:`ol`,properties:{},children:e.wrap(s,!0)},{type:`text`,value:`
`}]}}var ga=(function(e){if(e==null)return xa;if(typeof e==`function`)return ba(e);if(typeof e==`object`)return Array.isArray(e)?_a(e):va(e);if(typeof e==`string`)return ya(e);throw Error(`Expected function, string, or object as test`)});function _a(e){let t=[],n=-1;for(;++n<e.length;)t[n]=ga(e[n]);return ba(r);function r(...e){let n=-1;for(;++n<t.length;)if(t[n].apply(this,e))return!0;return!1}}function va(e){let t=e;return ba(n);function n(n){let r=n,i;for(i in e)if(r[i]!==t[i])return!1;return!0}}function ya(e){return ba(t);function t(t){return t&&t.type===e}}function ba(e){return t;function t(t,n,r){return!!(Sa(t)&&e.call(this,t,typeof n==`number`?n:void 0,r||void 0))}}function xa(){return!0}function Sa(e){return typeof e==`object`&&!!e&&`type`in e}function Ca(e){return e}var wa=[];function Ta(e,t,n,r){let i;typeof t==`function`&&typeof n!=`function`?(r=n,n=t):i=t;let a=ga(i),o=r?-1:1;s(e,void 0,[])();function s(e,i,c){let l=e&&typeof e==`object`?e:{};if(typeof l.type==`string`){let t=typeof l.tagName==`string`?l.tagName:typeof l.name==`string`?l.name:void 0;Object.defineProperty(u,"name",{value:`node (`+Ca(e.type+(t?`<`+t+`>`:``))+`)`})}return u;function u(){let l=wa,u,d,f;if((!t||a(e,i,c[c.length-1]||void 0))&&(l=Ea(n(e,c)),l[0]===!1))return l;if(`children`in e&&e.children){let t=e;if(t.children&&l[0]!==`skip`)for(d=(r?t.children.length:-1)+o,f=c.concat(t);d>-1&&d<t.children.length;){let e=t.children[d];if(u=s(e,d,f)(),u[0]===!1)return u;d=typeof u[1]==`number`?u[1]:d+o}}return l}}}function Ea(e){return Array.isArray(e)?e:typeof e==`number`?[!0,e]:e==null?wa:[e]}function Da(e,t,n,r){let i,a,o;typeof t==`function`&&typeof n!=`function`?(a=void 0,o=t,i=n):(a=t,o=n,i=r),Ta(e,a,s,i);function s(e,t){let n=t[t.length-1],r=n?n.children.indexOf(e):void 0;return o(e,r,n)}}var Oa={}.hasOwnProperty,ka={};function Aa(e,t){let n=t||ka,r=new Map,i=new Map,a={all:s,applyData:Ma,definitionById:r,footnoteById:i,footnoteCounts:new Map,footnoteOrder:[],handlers:{...$i,...n.handlers},one:o,options:n,patch:ja,wrap:Pa};return Da(e,function(e){if(e.type===`definition`||e.type===`footnoteDefinition`){let t=e.type===`definition`?r:i,n=String(e.identifier).toUpperCase();t.has(n)||t.set(n,e)}}),a;function o(e,t){let n=e.type,r=a.handlers[n];if(Oa.call(a.handlers,n)&&r)return r(a,e,t);if(a.options.passThrough&&a.options.passThrough.includes(n)){if(`children`in e){let{children:t,...n}=e,r=fa(n);return r.children=a.all(e),r}return fa(e)}return(a.options.unknownHandler||Na)(a,e,t)}function s(e){let t=[];if(`children`in e){let n=e.children,r=-1;for(;++r<n.length;){let i=a.one(n[r],e);if(i){if(r&&n[r-1].type===`break`&&(!Array.isArray(i)&&i.type===`text`&&(i.value=Fa(i.value)),!Array.isArray(i)&&i.type===`element`)){let e=i.children[0];e&&e.type===`text`&&(e.value=Fa(e.value))}Array.isArray(i)?t.push(...i):t.push(i)}}}return t}}function ja(e,t){e.position&&(t.position=Ge(e))}function Ma(e,t){let n=t;if(e&&e.data){let t=e.data.hName,r=e.data.hChildren,i=e.data.hProperties;typeof t==`string`&&(n.type===`element`?n.tagName=t:n={type:`element`,tagName:t,properties:{},children:`children`in n?n.children:[n]}),n.type===`element`&&i&&Object.assign(n.properties,fa(i)),`children`in n&&n.children&&r!=null&&(n.children=r)}return n}function Na(e,t){let n=t.data||{},r=`value`in t&&!(Oa.call(n,`hProperties`)||Oa.call(n,`hChildren`))?{type:`text`,value:t.value}:{type:`element`,tagName:`div`,properties:{},children:e.all(t)};return e.patch(t,r),e.applyData(t,r)}function Pa(e,t){let n=[],r=-1;for(t&&n.push({type:`text`,value:`
`});++r<e.length;)r&&n.push({type:`text`,value:`
`}),n.push(e[r]);return t&&e.length>0&&n.push({type:`text`,value:`
`}),n}function Fa(e){let t=0,n=e.charCodeAt(t);for(;n===9||n===32;)t++,n=e.charCodeAt(t);return e.slice(t)}function Ia(e,t){let n=Aa(e,t),r=n.one(e,void 0),i=ha(n),a=Array.isArray(r)?{type:`root`,children:r}:r||{type:`root`,children:[]};return i&&(`children`in a,a.children.push({type:`text`,value:`
`},i)),a}function La(e,t){return e&&`run`in e?async function(n,r){let i=Ia(n,{file:r,...t});await e.run(i,r)}:function(n,r){return Ia(n,{file:r,...e||t})}}function Ra(e){if(e)throw e}var za=o(((e,t)=>{var n=Object.prototype.hasOwnProperty,r=Object.prototype.toString,i=Object.defineProperty,a=Object.getOwnPropertyDescriptor,o=function(e){return typeof Array.isArray==`function`?Array.isArray(e):r.call(e)===`[object Array]`},s=function(e){if(!e||r.call(e)!==`[object Object]`)return!1;var t=n.call(e,`constructor`),i=e.constructor&&e.constructor.prototype&&n.call(e.constructor.prototype,`isPrototypeOf`);if(e.constructor&&!t&&!i)return!1;for(var a in e);return a===void 0||n.call(e,a)},c=function(e,t){i&&t.name===`__proto__`?i(e,t.name,{enumerable:!0,configurable:!0,value:t.newValue,writable:!0}):e[t.name]=t.newValue},l=function(e,t){if(t===`__proto__`){if(!n.call(e,t))return;if(a)return a(e,t).value}return e[t]};t.exports=function e(){var t,n,r,i,a,u,d=arguments[0],f=1,p=arguments.length,m=!1;for(typeof d==`boolean`&&(m=d,d=arguments[1]||{},f=2),(d==null||typeof d!=`object`&&typeof d!=`function`)&&(d={});f<p;++f)if(t=arguments[f],t!=null)for(n in t)r=l(d,n),i=l(t,n),d!==i&&(m&&i&&(s(i)||(a=o(i)))?(a?(a=!1,u=r&&o(r)?r:[]):u=r&&s(r)?r:{},c(d,{name:n,newValue:e(m,u,i)})):i!==void 0&&c(d,{name:n,newValue:i}));return d}}));function Ba(e){if(typeof e!=`object`||!e)return!1;let t=Object.getPrototypeOf(e);return(t===null||t===Object.prototype||Object.getPrototypeOf(t)===null)&&!(Symbol.toStringTag in e)&&!(Symbol.iterator in e)}function Va(){let e=[],t={run:n,use:r};return t;function n(...t){let n=-1,r=t.pop();if(typeof r!=`function`)throw TypeError(`Expected function as last argument, not `+r);i(null,...t);function i(a,...o){let s=e[++n],c=-1;if(a){r(a);return}for(;++c<t.length;)(o[c]===null||o[c]===void 0)&&(o[c]=t[c]);t=o,s?Ha(s,i)(...o):r(null,...o)}}function r(n){if(typeof n!=`function`)throw TypeError("Expected `middelware` to be a function, not "+n);return e.push(n),t}}function Ha(e,t){let n;return r;function r(...t){let r=e.length>t.length,o;r&&t.push(i);try{o=e.apply(this,t)}catch(e){let t=e;if(r&&n)throw t;return i(t)}r||(o&&o.then&&typeof o.then==`function`?o.then(a,i):o instanceof Error?i(o):a(o))}function i(e,...r){n||(n=!0,t(e,...r))}function a(e){i(null,e)}}var Ua={basename:Wa,dirname:Ga,extname:Ka,join:qa,sep:`/`};function Wa(e,t){if(t!==void 0&&typeof t!=`string`)throw TypeError(`"ext" argument must be a string`);Xa(e);let n=0,r=-1,i=e.length,a;if(t===void 0||t.length===0||t.length>e.length){for(;i--;)if(e.codePointAt(i)===47){if(a){n=i+1;break}}else r<0&&(a=!0,r=i+1);return r<0?``:e.slice(n,r)}if(t===e)return``;let o=-1,s=t.length-1;for(;i--;)if(e.codePointAt(i)===47){if(a){n=i+1;break}}else o<0&&(a=!0,o=i+1),s>-1&&(e.codePointAt(i)===t.codePointAt(s--)?s<0&&(r=i):(s=-1,r=o));return n===r?r=o:r<0&&(r=e.length),e.slice(n,r)}function Ga(e){if(Xa(e),e.length===0)return`.`;let t=-1,n=e.length,r;for(;--n;)if(e.codePointAt(n)===47){if(r){t=n;break}}else r||=!0;return t<0?e.codePointAt(0)===47?`/`:`.`:t===1&&e.codePointAt(0)===47?`//`:e.slice(0,t)}function Ka(e){Xa(e);let t=e.length,n=-1,r=0,i=-1,a=0,o;for(;t--;){let s=e.codePointAt(t);if(s===47){if(o){r=t+1;break}continue}n<0&&(o=!0,n=t+1),s===46?i<0?i=t:a!==1&&(a=1):i>-1&&(a=-1)}return i<0||n<0||a===0||a===1&&i===n-1&&i===r+1?``:e.slice(i,n)}function qa(...e){let t=-1,n;for(;++t<e.length;)Xa(e[t]),e[t]&&(n=n===void 0?e[t]:n+`/`+e[t]);return n===void 0?`.`:Ja(n)}function Ja(e){Xa(e);let t=e.codePointAt(0)===47,n=Ya(e,!t);return n.length===0&&!t&&(n=`.`),n.length>0&&e.codePointAt(e.length-1)===47&&(n+=`/`),t?`/`+n:n}function Ya(e,t){let n=``,r=0,i=-1,a=0,o=-1,s,c;for(;++o<=e.length;){if(o<e.length)s=e.codePointAt(o);else if(s===47)break;else s=47;if(s===47){if(!(i===o-1||a===1))if(i!==o-1&&a===2){if(n.length<2||r!==2||n.codePointAt(n.length-1)!==46||n.codePointAt(n.length-2)!==46){if(n.length>2){if(c=n.lastIndexOf(`/`),c!==n.length-1){c<0?(n=``,r=0):(n=n.slice(0,c),r=n.length-1-n.lastIndexOf(`/`)),i=o,a=0;continue}}else if(n.length>0){n=``,r=0,i=o,a=0;continue}}t&&(n=n.length>0?n+`/..`:`..`,r=2)}else n.length>0?n+=`/`+e.slice(i+1,o):n=e.slice(i+1,o),r=o-i-1;i=o,a=0}else s===46&&a>-1?a++:a=-1}return n}function Xa(e){if(typeof e!=`string`)throw TypeError(`Path must be a string. Received `+JSON.stringify(e))}var Za={cwd:Qa};function Qa(){return`/`}function $a(e){return!!(typeof e==`object`&&e&&`href`in e&&e.href&&`protocol`in e&&e.protocol&&e.auth===void 0)}function eo(e){if(typeof e==`string`)e=new URL(e);else if(!$a(e)){let t=TypeError('The "path" argument must be of type string or an instance of URL. Received `'+e+"`");throw t.code=`ERR_INVALID_ARG_TYPE`,t}if(e.protocol!==`file:`){let e=TypeError(`The URL must be of scheme file`);throw e.code=`ERR_INVALID_URL_SCHEME`,e}return to(e)}function to(e){if(e.hostname!==``){let e=TypeError(`File URL host must be "localhost" or empty on darwin`);throw e.code=`ERR_INVALID_FILE_URL_HOST`,e}let t=e.pathname,n=-1;for(;++n<t.length;)if(t.codePointAt(n)===37&&t.codePointAt(n+1)===50){let e=t.codePointAt(n+2);if(e===70||e===102){let e=TypeError(`File URL path must not include encoded / characters`);throw e.code=`ERR_INVALID_FILE_URL_PATH`,e}}return decodeURIComponent(t)}var no=[`history`,`path`,`basename`,`stem`,`extname`,`dirname`],ro=class{constructor(e){let t;t=e?$a(e)?{path:e}:typeof e==`string`||so(e)?{value:e}:e:{},this.cwd=`cwd`in t?``:Za.cwd(),this.data={},this.history=[],this.messages=[],this.value,this.map,this.result,this.stored;let n=-1;for(;++n<no.length;){let e=no[n];e in t&&t[e]!==void 0&&t[e]!==null&&(this[e]=e===`history`?[...t[e]]:t[e])}let r;for(r in t)no.includes(r)||(this[r]=t[r])}get basename(){return typeof this.path==`string`?Ua.basename(this.path):void 0}set basename(e){ao(e,`basename`),io(e,`basename`),this.path=Ua.join(this.dirname||``,e)}get dirname(){return typeof this.path==`string`?Ua.dirname(this.path):void 0}set dirname(e){oo(this.basename,`dirname`),this.path=Ua.join(e||``,this.basename)}get extname(){return typeof this.path==`string`?Ua.extname(this.path):void 0}set extname(e){if(io(e,`extname`),oo(this.dirname,`extname`),e){if(e.codePointAt(0)!==46)throw Error("`extname` must start with `.`");if(e.includes(`.`,1))throw Error("`extname` cannot contain multiple dots")}this.path=Ua.join(this.dirname,this.stem+(e||``))}get path(){return this.history[this.history.length-1]}set path(e){$a(e)&&(e=eo(e)),ao(e,`path`),this.path!==e&&this.history.push(e)}get stem(){return typeof this.path==`string`?Ua.basename(this.path,this.extname):void 0}set stem(e){ao(e,`stem`),io(e,`stem`),this.path=Ua.join(this.dirname||``,e+(this.extname||``))}fail(e,t,n){let r=this.message(e,t,n);throw r.fatal=!0,r}info(e,t,n){let r=this.message(e,t,n);return r.fatal=void 0,r}message(e,t,n){let r=new Xe(e,t,n);return this.path&&(r.name=this.path+`:`+r.name,r.file=this.path),r.fatal=!1,this.messages.push(r),r}toString(e){return this.value===void 0?``:typeof this.value==`string`?this.value:new TextDecoder(e||void 0).decode(this.value)}};function io(e,t){if(e&&e.includes(Ua.sep))throw Error("`"+t+"` cannot be a path: did not expect `"+Ua.sep+"`")}function ao(e,t){if(!e)throw Error("`"+t+"` cannot be empty")}function oo(e,t){if(!e)throw Error("Setting `"+t+"` requires `path` to be set too")}function so(e){return!!(e&&typeof e==`object`&&`byteLength`in e&&`byteOffset`in e)}var co=(function(e){let t=this.constructor.prototype,n=t[e],r=function(){return n.apply(r,arguments)};return Object.setPrototypeOf(r,t),r}),lo=l(za(),1),uo={}.hasOwnProperty,fo=new class e extends co{constructor(){super(`copy`),this.Compiler=void 0,this.Parser=void 0,this.attachers=[],this.compiler=void 0,this.freezeIndex=-1,this.frozen=void 0,this.namespace={},this.parser=void 0,this.transformers=Va()}copy(){let t=new e,n=-1;for(;++n<this.attachers.length;){let e=this.attachers[n];t.use(...e)}return t.data((0,lo.default)(!0,{},this.namespace)),t}data(e,t){return typeof e==`string`?arguments.length===2?(V(`data`,this.frozen),this.namespace[e]=t,this):uo.call(this.namespace,e)&&this.namespace[e]||void 0:e?(V(`data`,this.frozen),this.namespace=e,this):this.namespace}freeze(){if(this.frozen)return this;let e=this;for(;++this.freezeIndex<this.attachers.length;){let[t,...n]=this.attachers[this.freezeIndex];if(n[0]===!1)continue;n[0]===!0&&(n[0]=void 0);let r=t.call(e,...n);typeof r==`function`&&this.transformers.use(r)}return this.frozen=!0,this.freezeIndex=1/0,this}parse(e){this.freeze();let t=go(e),n=this.parser||this.Parser;return po(`parse`,n),n(String(t),t)}process(e,t){let n=this;return this.freeze(),po(`process`,this.parser||this.Parser),B(`process`,this.compiler||this.Compiler),t?r(void 0,t):new Promise(r);function r(r,i){let a=go(e),o=n.parse(a);n.run(o,a,function(e,t,r){if(e||!t||!r)return s(e);let i=t,a=n.stringify(i,r);vo(a)?r.value=a:r.result=a,s(e,r)});function s(e,n){e||!n?i(e):r?r(n):t(void 0,n)}}}processSync(e){let t=!1,n;return this.freeze(),po(`processSync`,this.parser||this.Parser),B(`processSync`,this.compiler||this.Compiler),this.process(e,r),ho(`processSync`,`process`,t),n;function r(e,r){t=!0,Ra(e),n=r}}run(e,t,n){mo(e),this.freeze();let r=this.transformers;return!n&&typeof t==`function`&&(n=t,t=void 0),n?i(void 0,n):new Promise(i);function i(i,a){let o=go(t);r.run(e,o,s);function s(t,r,o){let s=r||e;t?a(t):i?i(s):n(void 0,s,o)}}}runSync(e,t){let n=!1,r;return this.run(e,t,i),ho(`runSync`,`run`,n),r;function i(e,t){Ra(e),r=t,n=!0}}stringify(e,t){this.freeze();let n=go(t),r=this.compiler||this.Compiler;return B(`stringify`,r),mo(e),r(e,n)}use(e,...t){let n=this.attachers,r=this.namespace;if(V(`use`,this.frozen),e!=null)if(typeof e==`function`)s(e,t);else if(typeof e==`object`)Array.isArray(e)?o(e):a(e);else throw TypeError("Expected usable value, not `"+e+"`");return this;function i(e){if(typeof e==`function`)s(e,[]);else if(typeof e==`object`)if(Array.isArray(e)){let[t,...n]=e;s(t,n)}else a(e);else throw TypeError("Expected usable value, not `"+e+"`")}function a(e){if(!(`plugins`in e)&&!(`settings`in e))throw Error("Expected usable value but received an empty preset, which is probably a mistake: presets typically come with `plugins` and sometimes with `settings`, but this has neither");o(e.plugins),e.settings&&(r.settings=(0,lo.default)(!0,r.settings,e.settings))}function o(e){let t=-1;if(e!=null)if(Array.isArray(e))for(;++t<e.length;){let n=e[t];i(n)}else throw TypeError("Expected a list of plugins, not `"+e+"`")}function s(e,t){let r=-1,i=-1;for(;++r<n.length;)if(n[r][0]===e){i=r;break}if(i===-1)n.push([e,...t]);else if(t.length>0){let[r,...a]=t,o=n[i][1];Ba(o)&&Ba(r)&&(r=(0,lo.default)(!0,o,r)),n[i]=[e,r,...a]}}}}().freeze();function po(e,t){if(typeof t!=`function`)throw TypeError("Cannot `"+e+"` without `parser`")}function B(e,t){if(typeof t!=`function`)throw TypeError("Cannot `"+e+"` without `compiler`")}function V(e,t){if(t)throw Error("Cannot call `"+e+"` on a frozen processor.\nCreate a new processor first, by calling it: use `processor()` instead of `processor`.")}function mo(e){if(!Ba(e)||typeof e.type!=`string`)throw TypeError("Expected node, got `"+e+"`")}function ho(e,t,n){if(!n)throw Error("`"+e+"` finished async. Use `"+t+"` instead")}function go(e){return _o(e)?e:new ro(e)}function _o(e){return!!(e&&typeof e==`object`&&`message`in e&&`messages`in e)}function vo(e){return typeof e==`string`||yo(e)}function yo(e){return!!(e&&typeof e==`object`&&`byteLength`in e&&`byteOffset`in e)}var bo=[],xo={allowDangerousHtml:!0},H=/^(https?|ircs?|mailto|xmpp)$/i,So=[{from:`astPlugins`,id:`remove-buggy-html-in-markdown-parser`},{from:`allowDangerousHtml`,id:`remove-buggy-html-in-markdown-parser`},{from:`allowNode`,id:`replace-allownode-allowedtypes-and-disallowedtypes`,to:`allowElement`},{from:`allowedTypes`,id:`replace-allownode-allowedtypes-and-disallowedtypes`,to:`allowedElements`},{from:`className`,id:`remove-classname`},{from:`disallowedTypes`,id:`replace-allownode-allowedtypes-and-disallowedtypes`,to:`disallowedElements`},{from:`escapeHtml`,id:`remove-buggy-html-in-markdown-parser`},{from:`includeElementIndex`,id:`#remove-includeelementindex`},{from:`includeNodeIndex`,id:`change-includenodeindex-to-includeelementindex`},{from:`linkTarget`,id:`remove-linktarget`},{from:`plugins`,id:`change-plugins-to-remarkplugins`,to:`remarkPlugins`},{from:`rawSourcePos`,id:`#remove-rawsourcepos`},{from:`renderers`,id:`change-renderers-to-components`,to:`components`},{from:`source`,id:`change-source-to-children`,to:`children`},{from:`sourcePos`,id:`#remove-sourcepos`},{from:`transformImageUri`,id:`#add-urltransform`,to:`urlTransform`},{from:`transformLinkUri`,id:`#add-urltransform`,to:`urlTransform`}];function Co(e){let t=wo(e),n=To(e);return Eo(t.runSync(t.parse(n),n),e)}function wo(e){let t=e.rehypePlugins||bo,n=e.remarkPlugins||bo,r=e.remarkRehypeOptions?{...e.remarkRehypeOptions,...xo}:xo;return fo().use(wi).use(n).use(La,r).use(t)}function To(e){let t=e.children||``,n=new ro;return typeof t==`string`?n.value=t:``+t,n}function Eo(e,t){let n=t.allowedElements,r=t.allowElement,i=t.components,a=t.disallowedElements,o=t.skipHtml,s=t.unwrapDisallowed,c=t.urlTransform||Do;for(let e of So)Object.hasOwn(t,e.from)&&``+e.from+(e.to?"use `"+e.to+"` instead":`remove it`)+e.id;return Da(e,l),rt(e,{Fragment:S.Fragment,components:i,ignoreInvalidStyle:!0,jsx:S.jsx,jsxs:S.jsxs,passKeys:!0,passNode:!0});function l(e,t,i){if(e.type===`raw`&&i&&typeof t==`number`)return o?i.children.splice(t,1):i.children[t]={type:`text`,value:e.value},t;if(e.type===`element`){let t;for(t in Tt)if(Object.hasOwn(Tt,t)&&Object.hasOwn(e.properties,t)){let n=e.properties[t],r=Tt[t];(r===null||r.includes(e.tagName))&&(e.properties[t]=c(String(n||``),t,e))}}if(e.type===`element`){let o=n?!n.includes(e.tagName):a?a.includes(e.tagName):!1;if(!o&&r&&typeof t==`number`&&(o=!r(e,t,i)),o&&i&&typeof t==`number`)return s&&e.children?i.children.splice(t,1,...e.children):i.children.splice(t,1),t}}}function Do(e){let t=e.indexOf(`:`),n=e.indexOf(`?`),r=e.indexOf(`#`),i=e.indexOf(`/`);return t===-1||i!==-1&&t>i||n!==-1&&t>n||r!==-1&&t>r||H.test(e.slice(0,t))?e:``}function Oo(e,t){let n=String(e);if(typeof t!=`string`)throw TypeError(`Expected character`);let r=0,i=n.indexOf(t);for(;i!==-1;)r++,i=n.indexOf(t,i+t.length);return r}function ko(e){if(typeof e!=`string`)throw TypeError(`Expected a string`);return e.replace(/[|\\{}()[\]^$+*?.]/g,`\\$&`).replace(/-/g,`\\x2d`)}function Ao(e,t,n){let r=ga((n||{}).ignore||[]),i=jo(t),a=-1;for(;++a<i.length;)Ta(e,`text`,o);function o(e,t){let n=-1,i;for(;++n<t.length;){let e=t[n],a=i?i.children:void 0;if(r(e,a?a.indexOf(e):void 0,i))return;i=e}if(i)return s(e,t)}function s(e,t){let n=t[t.length-1],r=i[a][0],o=i[a][1],s=0,c=n.children.indexOf(e),l=!1,u=[];r.lastIndex=0;let d=r.exec(e.value);for(;d;){let n=d.index,i={index:d.index,input:d.input,stack:[...t,e]},a=o(...d,i);if(typeof a==`string`&&(a=a.length>0?{type:`text`,value:a}:void 0),a===!1?r.lastIndex=n+1:(s!==n&&u.push({type:`text`,value:e.value.slice(s,n)}),Array.isArray(a)?u.push(...a):a&&u.push(a),s=n+d[0].length,l=!0),!r.global)break;d=r.exec(e.value)}return l?(s<e.value.length&&u.push({type:`text`,value:e.value.slice(s)}),n.children.splice(c,1,...u)):u=[e],c+u.length}}function jo(e){let t=[];if(!Array.isArray(e))throw TypeError(`Expected find and replace tuple or list of tuples`);let n=!e[0]||Array.isArray(e[0])?e:[e],r=-1;for(;++r<n.length;){let e=n[r];t.push([Mo(e[0]),No(e[1])])}return t}function Mo(e){return typeof e==`string`?new RegExp(ko(e),`g`):e}function No(e){return typeof e==`function`?e:function(){return e}}var Po=`phrasing`,Fo=[`autolink`,`link`,`image`,`label`];function Io(){return{transforms:[Wo],enter:{literalAutolink:Ro,literalAutolinkEmail:zo,literalAutolinkHttp:zo,literalAutolinkWww:zo},exit:{literalAutolink:Uo,literalAutolinkEmail:Ho,literalAutolinkHttp:Bo,literalAutolinkWww:Vo}}}function Lo(){return{unsafe:[{character:`@`,before:`[+\\-.\\w]`,after:`[\\-.\\w]`,inConstruct:Po,notInConstruct:Fo},{character:`.`,before:`[Ww]`,after:`[\\-.\\w]`,inConstruct:Po,notInConstruct:Fo},{character:`:`,before:`[ps]`,after:`\\/`,inConstruct:Po,notInConstruct:Fo}]}}function Ro(e){this.enter({type:`link`,title:null,url:``,children:[]},e)}function zo(e){this.config.enter.autolinkProtocol.call(this,e)}function Bo(e){this.config.exit.autolinkProtocol.call(this,e)}function Vo(e){this.config.exit.data.call(this,e);let t=this.stack[this.stack.length-1];t.type,t.url=`http://`+this.sliceSerialize(e)}function Ho(e){this.config.exit.autolinkEmail.call(this,e)}function Uo(e){this.exit(e)}function Wo(e){Ao(e,[[/(https?:\/\/|www(?=\.))([-.\w]+)([^ \t\r\n]*)/gi,Go],[/(?<=^|\s|\p{P}|\p{S})([-.\w+]+)@([-\w]+(?:\.[-\w]+)+)/gu,Ko]],{ignore:[`link`,`linkReference`]})}function Go(e,t,n,r,i){let a=``;if(!Yo(i)||(/^w/i.test(t)&&(n=t+n,t=``,a=`http://`),!qo(n)))return!1;let o=Jo(n+r);if(!o[0])return!1;let s={type:`link`,title:null,url:a+t+o[0],children:[{type:`text`,value:t+o[0]}]};return o[1]?[s,{type:`text`,value:o[1]}]:s}function Ko(e,t,n,r){return!Yo(r,!0)||/[-\d_]$/.test(n)?!1:{type:`link`,title:null,url:`mailto:`+t+`@`+n,children:[{type:`text`,value:t+`@`+n}]}}function qo(e){let t=e.split(`.`);return!(t.length<2||t[t.length-1]&&(/_/.test(t[t.length-1])||!/[a-zA-Z\d]/.test(t[t.length-1]))||t[t.length-2]&&(/_/.test(t[t.length-2])||!/[a-zA-Z\d]/.test(t[t.length-2])))}function Jo(e){let t=/[!"&'),.:;<>?\]}]+$/.exec(e);if(!t)return[e,void 0];e=e.slice(0,t.index);let n=t[0],r=n.indexOf(`)`),i=Oo(e,`(`),a=Oo(e,`)`);for(;r!==-1&&i>a;)e+=n.slice(0,r+1),n=n.slice(r+1),r=n.indexOf(`)`),a++;return[e,n]}function Yo(e,t){let n=e.input.charCodeAt(e.index-1);return(e.index===0||Yt(n)||Jt(n))&&(!t||n!==47)}as.peek=is;function Xo(){this.buffer()}function Zo(e){this.enter({type:`footnoteReference`,identifier:``,label:``},e)}function Qo(){this.buffer()}function $o(e){this.enter({type:`footnoteDefinition`,identifier:``,label:``,children:[]},e)}function es(e){let t=this.resume(),n=this.stack[this.stack.length-1];n.type,n.identifier=Bt(this.sliceSerialize(e)).toLowerCase(),n.label=t}function ts(e){this.exit(e)}function ns(e){let t=this.resume(),n=this.stack[this.stack.length-1];n.type,n.identifier=Bt(this.sliceSerialize(e)).toLowerCase(),n.label=t}function rs(e){this.exit(e)}function is(){return`[`}function as(e,t,n,r){let i=n.createTracker(r),a=i.move(`[^`),o=n.enter(`footnoteReference`),s=n.enter(`reference`);return a+=i.move(n.safe(n.associationId(e),{after:`]`,before:a})),s(),o(),a+=i.move(`]`),a}function os(){return{enter:{gfmFootnoteCallString:Xo,gfmFootnoteCall:Zo,gfmFootnoteDefinitionLabelString:Qo,gfmFootnoteDefinition:$o},exit:{gfmFootnoteCallString:es,gfmFootnoteCall:ts,gfmFootnoteDefinitionLabelString:ns,gfmFootnoteDefinition:rs}}}function ss(e){let t=!1;return e&&e.firstLineBlank&&(t=!0),{handlers:{footnoteDefinition:n,footnoteReference:as},unsafe:[{character:`[`,inConstruct:[`label`,`phrasing`,`reference`]}]};function n(e,n,r,i){let a=r.createTracker(i),o=a.move(`[^`),s=r.enter(`footnoteDefinition`),c=r.enter(`label`);return o+=a.move(r.safe(r.associationId(e),{before:o,after:`]`})),c(),o+=a.move(`]:`),e.children&&e.children.length>0&&(a.shift(4),o+=a.move((t?`
`:` `)+r.indentLines(r.containerFlow(e,a.current()),t?ls:cs))),s(),o}}function cs(e,t,n){return t===0?e:ls(e,t,n)}function ls(e,t,n){return(n?``:`    `)+e}var us=[`autolink`,`destinationLiteral`,`destinationRaw`,`reference`,`titleQuote`,`titleApostrophe`];hs.peek=gs;function ds(){return{canContainEols:[`delete`],enter:{strikethrough:ps},exit:{strikethrough:ms}}}function fs(){return{unsafe:[{character:`~`,inConstruct:`phrasing`,notInConstruct:us}],handlers:{delete:hs}}}function ps(e){this.enter({type:`delete`,children:[]},e)}function ms(e){this.exit(e)}function hs(e,t,n,r){let i=n.createTracker(r),a=n.enter(`strikethrough`),o=i.move(`~~`);return o+=n.containerPhrasing(e,{...i.current(),before:o,after:`~`}),o+=i.move(`~~`),a(),o}function gs(){return`~`}function _s(e){return e.length}function vs(e,t){let n=t||{},r=(n.align||[]).concat(),i=n.stringLength||_s,a=[],o=[],s=[],c=[],l=0,u=-1;for(;++u<e.length;){let t=[],r=[],a=-1;for(e[u].length>l&&(l=e[u].length);++a<e[u].length;){let o=ys(e[u][a]);if(n.alignDelimiters!==!1){let e=i(o);r[a]=e,(c[a]===void 0||e>c[a])&&(c[a]=e)}t.push(o)}o[u]=t,s[u]=r}let d=-1;if(typeof r==`object`&&`length`in r)for(;++d<l;)a[d]=bs(r[d]);else{let e=bs(r);for(;++d<l;)a[d]=e}d=-1;let f=[],p=[];for(;++d<l;){let e=a[d],t=``,r=``;e===99?(t=`:`,r=`:`):e===108?t=`:`:e===114&&(r=`:`);let i=n.alignDelimiters===!1?1:Math.max(1,c[d]-t.length-r.length),o=t+`-`.repeat(i)+r;n.alignDelimiters!==!1&&(i=t.length+i+r.length,i>c[d]&&(c[d]=i),p[d]=i),f[d]=o}o.splice(1,0,f),s.splice(1,0,p),u=-1;let m=[];for(;++u<o.length;){let e=o[u],t=s[u];d=-1;let r=[];for(;++d<l;){let i=e[d]||``,o=``,s=``;if(n.alignDelimiters!==!1){let e=c[d]-(t[d]||0),n=a[d];n===114?o=` `.repeat(e):n===99?e%2?(o=` `.repeat(e/2+.5),s=` `.repeat(e/2-.5)):(o=` `.repeat(e/2),s=o):s=` `.repeat(e)}n.delimiterStart!==!1&&!d&&r.push(`|`),n.padding!==!1&&!(n.alignDelimiters===!1&&i===``)&&(n.delimiterStart!==!1||d)&&r.push(` `),n.alignDelimiters!==!1&&r.push(o),r.push(i),n.alignDelimiters!==!1&&r.push(s),n.padding!==!1&&r.push(` `),(n.delimiterEnd!==!1||d!==l-1)&&r.push(`|`)}m.push(n.delimiterEnd===!1?r.join(``).replace(/ +$/,``):r.join(``))}return m.join(`
`)}function ys(e){return e==null?``:String(e)}function bs(e){let t=typeof e==`string`?e.codePointAt(0):0;return t===67||t===99?99:t===76||t===108?108:t===82||t===114?114:0}function xs(e,t,n,r){let i=n.enter(`blockquote`),a=n.createTracker(r);a.move(`> `),a.shift(2);let o=n.indentLines(n.containerFlow(e,a.current()),Ss);return i(),o}function Ss(e,t,n){return`>`+(n?``:` `)+e}function Cs(e,t){return ws(e,t.inConstruct,!0)&&!ws(e,t.notInConstruct,!1)}function ws(e,t,n){if(typeof t==`string`&&(t=[t]),!t||t.length===0)return n;let r=-1;for(;++r<t.length;)if(e.includes(t[r]))return!0;return!1}function Ts(e,t,n,r){let i=-1;for(;++i<n.unsafe.length;)if(n.unsafe[i].character===`
`&&Cs(n.stack,n.unsafe[i]))return/[ \t]/.test(r.before)?``:` `;return`\\
`}function Es(e,t){let n=String(e),r=n.indexOf(t),i=r,a=0,o=0;if(typeof t!=`string`)throw TypeError(`Expected substring`);for(;r!==-1;)r===i?++a>o&&(o=a):a=1,i=r+t.length,r=n.indexOf(t,i);return o}function Ds(e,t){return!!(t.options.fences===!1&&e.value&&!e.lang&&/[^ \r\n]/.test(e.value)&&!/^[\t ]*(?:[\r\n]|$)|(?:^|[\r\n])[\t ]*$/.test(e.value))}function Os(e){let t=e.options.fence||"`";if(t!=="`"&&t!==`~`)throw Error("Cannot serialize code with `"+t+"` for `options.fence`, expected `` ` `` or `~`");return t}function ks(e,t,n,r){let i=Os(n),a=e.value||``,o=i==="`"?`GraveAccent`:`Tilde`;if(Ds(e,n)){let e=n.enter(`codeIndented`),t=n.indentLines(a,As);return e(),t}let s=n.createTracker(r),c=i.repeat(Math.max(Es(a,i)+1,3)),l=n.enter(`codeFenced`),u=s.move(c);if(e.lang){let t=n.enter(`codeFencedLang${o}`);u+=s.move(n.safe(e.lang,{before:u,after:` `,encode:["`"],...s.current()})),t()}if(e.lang&&e.meta){let t=n.enter(`codeFencedMeta${o}`);u+=s.move(` `),u+=s.move(n.safe(e.meta,{before:u,after:`
`,encode:["`"],...s.current()})),t()}return u+=s.move(`
`),a&&(u+=s.move(a+`
`)),u+=s.move(c),l(),u}function As(e,t,n){return(n?``:`    `)+e}function js(e){let t=e.options.quote||`"`;if(t!==`"`&&t!==`'`)throw Error("Cannot serialize title with `"+t+"` for `options.quote`, expected `\"`, or `'`");return t}function Ms(e,t,n,r){let i=js(n),a=i===`"`?`Quote`:`Apostrophe`,o=n.enter(`definition`),s=n.enter(`label`),c=n.createTracker(r),l=c.move(`[`);return l+=c.move(n.safe(n.associationId(e),{before:l,after:`]`,...c.current()})),l+=c.move(`]: `),s(),!e.url||/[\0- \u007F]/.test(e.url)?(s=n.enter(`destinationLiteral`),l+=c.move(`<`),l+=c.move(n.safe(e.url,{before:l,after:`>`,...c.current()})),l+=c.move(`>`)):(s=n.enter(`destinationRaw`),l+=c.move(n.safe(e.url,{before:l,after:e.title?` `:`
`,...c.current()}))),s(),e.title&&(s=n.enter(`title${a}`),l+=c.move(` `+i),l+=c.move(n.safe(e.title,{before:l,after:i,...c.current()})),l+=c.move(i),s()),o(),l}function Ns(e){let t=e.options.emphasis||`*`;if(t!==`*`&&t!==`_`)throw Error("Cannot serialize emphasis with `"+t+"` for `options.emphasis`, expected `*`, or `_`");return t}function Ps(e){return`&#x`+e.toString(16).toUpperCase()+`;`}function Fs(e,t,n){let r=an(e),i=an(t);return r===void 0?i===void 0?n===`_`?{inside:!0,outside:!0}:{inside:!1,outside:!1}:i===1?{inside:!0,outside:!0}:{inside:!1,outside:!0}:r===1?i===void 0?{inside:!1,outside:!1}:i===1?{inside:!0,outside:!0}:{inside:!1,outside:!1}:i===void 0?{inside:!1,outside:!1}:i===1?{inside:!0,outside:!1}:{inside:!1,outside:!1}}Is.peek=Ls;function Is(e,t,n,r){let i=Ns(n),a=n.enter(`emphasis`),o=n.createTracker(r),s=o.move(i),c=o.move(n.containerPhrasing(e,{after:i,before:s,...o.current()})),l=c.charCodeAt(0),u=Fs(r.before.charCodeAt(r.before.length-1),l,i);u.inside&&(c=Ps(l)+c.slice(1));let d=c.charCodeAt(c.length-1),f=Fs(r.after.charCodeAt(0),d,i);f.inside&&(c=c.slice(0,-1)+Ps(d));let p=o.move(i);return a(),n.attentionEncodeSurroundingInfo={after:f.outside,before:u.outside},s+c+p}function Ls(e,t,n){return n.options.emphasis||`*`}function Rs(e,t){let n=!1;return Da(e,function(e){if(`value`in e&&/\r?\n|\r/.test(e.value)||e.type===`break`)return n=!0,!1}),!!((!e.depth||e.depth<3)&&Dt(e)&&(t.options.setext||n))}function zs(e,t,n,r){let i=Math.max(Math.min(6,e.depth||1),1),a=n.createTracker(r);if(Rs(e,n)){let t=n.enter(`headingSetext`),r=n.enter(`phrasing`),o=n.containerPhrasing(e,{...a.current(),before:`
`,after:`
`});return r(),t(),o+`
`+(i===1?`=`:`-`).repeat(o.length-(Math.max(o.lastIndexOf(`\r`),o.lastIndexOf(`
`))+1))}let o=`#`.repeat(i),s=n.enter(`headingAtx`),c=n.enter(`phrasing`);a.move(o+` `);let l=n.containerPhrasing(e,{before:`# `,after:`
`,...a.current()});return/^[\t ]/.test(l)&&(l=Ps(l.charCodeAt(0))+l.slice(1)),l=l?o+` `+l:o,n.options.closeAtx&&(l+=` `+o),c(),s(),l}Bs.peek=Vs;function Bs(e){return e.value||``}function Vs(){return`<`}Hs.peek=Us;function Hs(e,t,n,r){let i=js(n),a=i===`"`?`Quote`:`Apostrophe`,o=n.enter(`image`),s=n.enter(`label`),c=n.createTracker(r),l=c.move(`![`);return l+=c.move(n.safe(e.alt,{before:l,after:`]`,...c.current()})),l+=c.move(`](`),s(),!e.url&&e.title||/[\0- \u007F]/.test(e.url)?(s=n.enter(`destinationLiteral`),l+=c.move(`<`),l+=c.move(n.safe(e.url,{before:l,after:`>`,...c.current()})),l+=c.move(`>`)):(s=n.enter(`destinationRaw`),l+=c.move(n.safe(e.url,{before:l,after:e.title?` `:`)`,...c.current()}))),s(),e.title&&(s=n.enter(`title${a}`),l+=c.move(` `+i),l+=c.move(n.safe(e.title,{before:l,after:i,...c.current()})),l+=c.move(i),s()),l+=c.move(`)`),o(),l}function Us(){return`!`}Ws.peek=Gs;function Ws(e,t,n,r){let i=e.referenceType,a=n.enter(`imageReference`),o=n.enter(`label`),s=n.createTracker(r),c=s.move(`![`),l=n.safe(e.alt,{before:c,after:`]`,...s.current()});c+=s.move(l+`][`),o();let u=n.stack;n.stack=[],o=n.enter(`reference`);let d=n.safe(n.associationId(e),{before:c,after:`]`,...s.current()});return o(),n.stack=u,a(),i===`full`||!l||l!==d?c+=s.move(d+`]`):i===`shortcut`?c=c.slice(0,-1):c+=s.move(`]`),c}function Gs(){return`!`}Ks.peek=qs;function Ks(e,t,n){let r=e.value||``,i="`",a=-1;for(;RegExp("(^|[^`])"+i+"([^`]|$)").test(r);)i+="`";for(/[^ \r\n]/.test(r)&&(/^[ \r\n]/.test(r)&&/[ \r\n]$/.test(r)||/^`|`$/.test(r))&&(r=` `+r+` `);++a<n.unsafe.length;){let e=n.unsafe[a],t=n.compilePattern(e),i;if(e.atBreak)for(;i=t.exec(r);){let e=i.index;r.charCodeAt(e)===10&&r.charCodeAt(e-1)===13&&e--,r=r.slice(0,e)+` `+r.slice(i.index+1)}}return i+r+i}function qs(){return"`"}function Js(e,t){let n=Dt(e);return!!(!t.options.resourceLink&&e.url&&!e.title&&e.children&&e.children.length===1&&e.children[0].type===`text`&&(n===e.url||`mailto:`+n===e.url)&&/^[a-z][a-z+.-]+:/i.test(e.url)&&!/[\0- <>\u007F]/.test(e.url))}Ys.peek=Xs;function Ys(e,t,n,r){let i=js(n),a=i===`"`?`Quote`:`Apostrophe`,o=n.createTracker(r),s,c;if(Js(e,n)){let t=n.stack;n.stack=[],s=n.enter(`autolink`);let r=o.move(`<`);return r+=o.move(n.containerPhrasing(e,{before:r,after:`>`,...o.current()})),r+=o.move(`>`),s(),n.stack=t,r}s=n.enter(`link`),c=n.enter(`label`);let l=o.move(`[`);return l+=o.move(n.containerPhrasing(e,{before:l,after:`](`,...o.current()})),l+=o.move(`](`),c(),!e.url&&e.title||/[\0- \u007F]/.test(e.url)?(c=n.enter(`destinationLiteral`),l+=o.move(`<`),l+=o.move(n.safe(e.url,{before:l,after:`>`,...o.current()})),l+=o.move(`>`)):(c=n.enter(`destinationRaw`),l+=o.move(n.safe(e.url,{before:l,after:e.title?` `:`)`,...o.current()}))),c(),e.title&&(c=n.enter(`title${a}`),l+=o.move(` `+i),l+=o.move(n.safe(e.title,{before:l,after:i,...o.current()})),l+=o.move(i),c()),l+=o.move(`)`),s(),l}function Xs(e,t,n){return Js(e,n)?`<`:`[`}Zs.peek=Qs;function Zs(e,t,n,r){let i=e.referenceType,a=n.enter(`linkReference`),o=n.enter(`label`),s=n.createTracker(r),c=s.move(`[`),l=n.containerPhrasing(e,{before:c,after:`]`,...s.current()});c+=s.move(l+`][`),o();let u=n.stack;n.stack=[],o=n.enter(`reference`);let d=n.safe(n.associationId(e),{before:c,after:`]`,...s.current()});return o(),n.stack=u,a(),i===`full`||!l||l!==d?c+=s.move(d+`]`):i===`shortcut`?c=c.slice(0,-1):c+=s.move(`]`),c}function Qs(){return`[`}function $s(e){let t=e.options.bullet||`*`;if(t!==`*`&&t!==`+`&&t!==`-`)throw Error("Cannot serialize items with `"+t+"` for `options.bullet`, expected `*`, `+`, or `-`");return t}function ec(e){let t=$s(e),n=e.options.bulletOther;if(!n)return t===`*`?`-`:`*`;if(n!==`*`&&n!==`+`&&n!==`-`)throw Error("Cannot serialize items with `"+n+"` for `options.bulletOther`, expected `*`, `+`, or `-`");if(n===t)throw Error("Expected `bullet` (`"+t+"`) and `bulletOther` (`"+n+"`) to be different");return n}function tc(e){let t=e.options.bulletOrdered||`.`;if(t!==`.`&&t!==`)`)throw Error("Cannot serialize items with `"+t+"` for `options.bulletOrdered`, expected `.` or `)`");return t}function nc(e){let t=e.options.rule||`*`;if(t!==`*`&&t!==`-`&&t!==`_`)throw Error("Cannot serialize rules with `"+t+"` for `options.rule`, expected `*`, `-`, or `_`");return t}function rc(e,t,n,r){let i=n.enter(`list`),a=n.bulletCurrent,o=e.ordered?tc(n):$s(n),s=e.ordered?o===`.`?`)`:`.`:ec(n),c=t&&n.bulletLastUsed?o===n.bulletLastUsed:!1;if(!e.ordered){let t=e.children?e.children[0]:void 0;if((o===`*`||o===`-`)&&t&&(!t.children||!t.children[0])&&n.stack[n.stack.length-1]===`list`&&n.stack[n.stack.length-2]===`listItem`&&n.stack[n.stack.length-3]===`list`&&n.stack[n.stack.length-4]===`listItem`&&n.indexStack[n.indexStack.length-1]===0&&n.indexStack[n.indexStack.length-2]===0&&n.indexStack[n.indexStack.length-3]===0&&(c=!0),nc(n)===o&&t){let t=-1;for(;++t<e.children.length;){let n=e.children[t];if(n&&n.type===`listItem`&&n.children&&n.children[0]&&n.children[0].type===`thematicBreak`){c=!0;break}}}}c&&(o=s),n.bulletCurrent=o;let l=n.containerFlow(e,r);return n.bulletLastUsed=o,n.bulletCurrent=a,i(),l}function ic(e){let t=e.options.listItemIndent||`one`;if(t!==`tab`&&t!==`one`&&t!==`mixed`)throw Error("Cannot serialize items with `"+t+"` for `options.listItemIndent`, expected `tab`, `one`, or `mixed`");return t}function ac(e,t,n,r){let i=ic(n),a=n.bulletCurrent||$s(n);t&&t.type===`list`&&t.ordered&&(a=(typeof t.start==`number`&&t.start>-1?t.start:1)+(n.options.incrementListMarker===!1?0:t.children.indexOf(e))+a);let o=a.length+1;(i===`tab`||i===`mixed`&&(t&&t.type===`list`&&t.spread||e.spread))&&(o=Math.ceil(o/4)*4);let s=n.createTracker(r);s.move(a+` `.repeat(o-a.length)),s.shift(o);let c=n.enter(`listItem`),l=n.indentLines(n.containerFlow(e,s.current()),u);return c(),l;function u(e,t,n){return t?(n?``:` `.repeat(o))+e:(n?a:a+` `.repeat(o-a.length))+e}}function oc(e,t,n,r){let i=n.enter(`paragraph`),a=n.enter(`phrasing`),o=n.containerPhrasing(e,r);return a(),i(),o}var sc=ga([`break`,`delete`,`emphasis`,`footnote`,`footnoteReference`,`image`,`imageReference`,`inlineCode`,`inlineMath`,`link`,`linkReference`,`mdxJsxTextElement`,`mdxTextExpression`,`strong`,`text`,`textDirective`]);function cc(e,t,n,r){return(e.children.some(function(e){return sc(e)})?n.containerPhrasing:n.containerFlow).call(n,e,r)}function lc(e){let t=e.options.strong||`*`;if(t!==`*`&&t!==`_`)throw Error("Cannot serialize strong with `"+t+"` for `options.strong`, expected `*`, or `_`");return t}uc.peek=dc;function uc(e,t,n,r){let i=lc(n),a=n.enter(`strong`),o=n.createTracker(r),s=o.move(i+i),c=o.move(n.containerPhrasing(e,{after:i,before:s,...o.current()})),l=c.charCodeAt(0),u=Fs(r.before.charCodeAt(r.before.length-1),l,i);u.inside&&(c=Ps(l)+c.slice(1));let d=c.charCodeAt(c.length-1),f=Fs(r.after.charCodeAt(0),d,i);f.inside&&(c=c.slice(0,-1)+Ps(d));let p=o.move(i+i);return a(),n.attentionEncodeSurroundingInfo={after:f.outside,before:u.outside},s+c+p}function dc(e,t,n){return n.options.strong||`*`}function fc(e,t,n,r){return n.safe(e.value,r)}function pc(e){let t=e.options.ruleRepetition||3;if(t<3)throw Error("Cannot serialize rules with repetition `"+t+"` for `options.ruleRepetition`, expected `3` or more");return t}function mc(e,t,n){let r=(nc(n)+(n.options.ruleSpaces?` `:``)).repeat(pc(n));return n.options.ruleSpaces?r.slice(0,-1):r}var hc={blockquote:xs,break:Ts,code:ks,definition:Ms,emphasis:Is,hardBreak:Ts,heading:zs,html:Bs,image:Hs,imageReference:Ws,inlineCode:Ks,link:Ys,linkReference:Zs,list:rc,listItem:ac,paragraph:oc,root:cc,strong:uc,text:fc,thematicBreak:mc};function gc(){return{enter:{table:_c,tableData:xc,tableHeader:xc,tableRow:yc},exit:{codeText:Sc,table:vc,tableData:bc,tableHeader:bc,tableRow:bc}}}function _c(e){let t=e._align;this.enter({type:`table`,align:t.map(function(e){return e===`none`?null:e}),children:[]},e),this.data.inTable=!0}function vc(e){this.exit(e),this.data.inTable=void 0}function yc(e){this.enter({type:`tableRow`,children:[]},e)}function bc(e){this.exit(e)}function xc(e){this.enter({type:`tableCell`,children:[]},e)}function Sc(e){let t=this.resume();this.data.inTable&&(t=t.replace(/\\([\\|])/g,Cc));let n=this.stack[this.stack.length-1];n.type,n.value=t,this.exit(e)}function Cc(e,t){return t===`|`?t:e}function wc(e){let t=e||{},n=t.tableCellPadding,r=t.tablePipeAlign,i=t.stringLength,a=n?` `:`|`;return{unsafe:[{character:`\r`,inConstruct:`tableCell`},{character:`
`,inConstruct:`tableCell`},{atBreak:!0,character:`|`,after:`[	 :-]`},{character:`|`,inConstruct:`tableCell`},{atBreak:!0,character:`:`,after:`-`},{atBreak:!0,character:`-`,after:`[:|-]`}],handlers:{inlineCode:f,table:o,tableCell:c,tableRow:s}};function o(e,t,n,r){return l(u(e,n,r),e.align)}function s(e,t,n,r){let i=l([d(e,n,r)]);return i.slice(0,i.indexOf(`
`))}function c(e,t,n,r){let i=n.enter(`tableCell`),o=n.enter(`phrasing`),s=n.containerPhrasing(e,{...r,before:a,after:a});return o(),i(),s}function l(e,t){return vs(e,{align:t,alignDelimiters:r,padding:n,stringLength:i})}function u(e,t,n){let r=e.children,i=-1,a=[],o=t.enter(`table`);for(;++i<r.length;)a[i]=d(r[i],t,n);return o(),a}function d(e,t,n){let r=e.children,i=-1,a=[],o=t.enter(`tableRow`);for(;++i<r.length;)a[i]=c(r[i],e,t,n);return o(),a}function f(e,t,n){let r=hc.inlineCode(e,t,n);return n.stack.includes(`tableCell`)&&(r=r.replace(/\|/g,`\\$&`)),r}}function Tc(){return{exit:{taskListCheckValueChecked:Dc,taskListCheckValueUnchecked:Dc,paragraph:Oc}}}function Ec(){return{unsafe:[{atBreak:!0,character:`-`,after:`[:|-]`}],handlers:{listItem:kc}}}function Dc(e){let t=this.stack[this.stack.length-2];t.type,t.checked=e.type===`taskListCheckValueChecked`}function Oc(e){let t=this.stack[this.stack.length-2];if(t&&t.type===`listItem`&&typeof t.checked==`boolean`){let e=this.stack[this.stack.length-1];e.type;let n=e.children[0];if(n&&n.type===`text`){let r=t.children,i=-1,a;for(;++i<r.length;){let e=r[i];if(e.type===`paragraph`){a=e;break}}a===e&&(n.value=n.value.slice(1),n.value.length===0?e.children.shift():e.position&&n.position&&typeof n.position.start.offset==`number`&&(n.position.start.column++,n.position.start.offset++,e.position.start=Object.assign({},n.position.start)))}}this.exit(e)}function kc(e,t,n,r){let i=e.children[0],a=typeof e.checked==`boolean`&&i&&i.type===`paragraph`,o=`[`+(e.checked?`x`:` `)+`] `,s=n.createTracker(r);a&&s.move(o);let c=hc.listItem(e,t,n,{...r,...s.current()});return a&&(c=c.replace(/^(?:[*+-]|\d+\.)([\r\n]| {1,3})/,l)),c;function l(e){return e+o}}function Ac(){return[Io(),os(),ds(),gc(),Tc()]}function jc(e){return{extensions:[Lo(),ss(e),fs(),wc(e),Ec()]}}var Mc={tokenize:Gc,partial:!0},Nc={tokenize:Kc,partial:!0},Pc={tokenize:qc,partial:!0},Fc={tokenize:Jc,partial:!0},Ic={tokenize:Yc,partial:!0},Lc={name:`wwwAutolink`,tokenize:Uc,previous:Xc},Rc={name:`protocolAutolink`,tokenize:Wc,previous:Zc},U={name:`emailAutolink`,tokenize:Hc,previous:Qc},zc={};function Bc(){return{text:zc}}for(var Vc=48;Vc<123;)zc[Vc]=U,Vc++,Vc===58?Vc=65:Vc===91&&(Vc=97);zc[43]=U,zc[45]=U,zc[46]=U,zc[95]=U,zc[72]=[U,Rc],zc[104]=[U,Rc],zc[87]=[U,Lc],zc[119]=[U,Lc];function Hc(e,t,n){let r=this,i,a;return o;function o(t){return!$c(t)||!Qc.call(r,r.previous)||el(r.events)?n(t):(e.enter(`literalAutolink`),e.enter(`literalAutolinkEmail`),s(t))}function s(t){return $c(t)?(e.consume(t),s):t===64?(e.consume(t),c):n(t)}function c(t){return t===46?e.check(Ic,u,l)(t):t===45||t===95||Ht(t)?(a=!0,e.consume(t),c):u(t)}function l(t){return e.consume(t),i=!0,c}function u(o){return a&&i&&Vt(r.previous)?(e.exit(`literalAutolinkEmail`),e.exit(`literalAutolink`),t(o)):n(o)}}function Uc(e,t,n){let r=this;return i;function i(t){return t!==87&&t!==119||!Xc.call(r,r.previous)||el(r.events)?n(t):(e.enter(`literalAutolink`),e.enter(`literalAutolinkWww`),e.check(Mc,e.attempt(Nc,e.attempt(Pc,a),n),n)(t))}function a(n){return e.exit(`literalAutolinkWww`),e.exit(`literalAutolink`),t(n)}}function Wc(e,t,n){let r=this,i=``,a=!1;return o;function o(t){return(t===72||t===104)&&Zc.call(r,r.previous)&&!el(r.events)?(e.enter(`literalAutolink`),e.enter(`literalAutolinkHttp`),i+=String.fromCodePoint(t),e.consume(t),s):n(t)}function s(t){if(Vt(t)&&i.length<5)return i+=String.fromCodePoint(t),e.consume(t),s;if(t===58){let n=i.toLowerCase();if(n===`http`||n===`https`)return e.consume(t),c}return n(t)}function c(t){return t===47?(e.consume(t),a?l:(a=!0,c)):n(t)}function l(t){return t===null||Wt(t)||F(t)||Yt(t)||Jt(t)?n(t):e.attempt(Nc,e.attempt(Pc,u),n)(t)}function u(n){return e.exit(`literalAutolinkHttp`),e.exit(`literalAutolink`),t(n)}}function Gc(e,t,n){let r=0;return i;function i(t){return(t===87||t===119)&&r<3?(r++,e.consume(t),i):t===46&&r===3?(e.consume(t),a):n(t)}function a(e){return e===null?n(e):t(e)}}function Kc(e,t,n){let r,i,a;return o;function o(t){return t===46||t===95?e.check(Fc,c,s)(t):t===null||F(t)||Yt(t)||t!==45&&Jt(t)?c(t):(a=!0,e.consume(t),o)}function s(t){return t===95?r=!0:(i=r,r=void 0),e.consume(t),o}function c(e){return i||r||!a?n(e):t(e)}}function qc(e,t){let n=0,r=0;return i;function i(o){return o===40?(n++,e.consume(o),i):o===41&&r<n?a(o):o===33||o===34||o===38||o===39||o===41||o===42||o===44||o===46||o===58||o===59||o===60||o===63||o===93||o===95||o===126?e.check(Fc,t,a)(o):o===null||F(o)||Yt(o)?t(o):(e.consume(o),i)}function a(t){return t===41&&r++,e.consume(t),i}}function Jc(e,t,n){return r;function r(o){return o===33||o===34||o===39||o===41||o===42||o===44||o===46||o===58||o===59||o===63||o===95||o===126?(e.consume(o),r):o===38?(e.consume(o),a):o===93?(e.consume(o),i):o===60||o===null||F(o)||Yt(o)?t(o):n(o)}function i(e){return e===null||e===40||e===91||F(e)||Yt(e)?t(e):r(e)}function a(e){return Vt(e)?o(e):n(e)}function o(t){return t===59?(e.consume(t),r):Vt(t)?(e.consume(t),o):n(t)}}function Yc(e,t,n){return r;function r(t){return e.consume(t),i}function i(e){return Ht(e)?n(e):t(e)}}function Xc(e){return e===null||e===40||e===42||e===95||e===91||e===93||e===126||F(e)}function Zc(e){return!Vt(e)}function Qc(e){return!(e===47||$c(e))}function $c(e){return e===43||e===45||e===46||e===95||Ht(e)}function el(e){let t=e.length,n=!1;for(;t--;){let r=e[t][1];if((r.type===`labelLink`||r.type===`labelImage`)&&!r._balanced){n=!0;break}if(r._gfmAutolinkLiteralWalkedInto){n=!1;break}}return e.length>0&&!n&&(e[e.length-1][1]._gfmAutolinkLiteralWalkedInto=!0),n}var tl={tokenize:W,partial:!0};function nl(){return{document:{91:{name:`gfmFootnoteDefinition`,tokenize:ol,continuation:{tokenize:sl},exit:cl}},text:{91:{name:`gfmFootnoteCall`,tokenize:al},93:{name:`gfmPotentialFootnoteCall`,add:`after`,tokenize:rl,resolveTo:il}}}}function rl(e,t,n){let r=this,i=r.events.length,a=r.parser.gfmFootnotes||(r.parser.gfmFootnotes=[]),o;for(;i--;){let e=r.events[i][1];if(e.type===`labelImage`){o=e;break}if(e.type===`gfmFootnoteCall`||e.type===`labelLink`||e.type===`label`||e.type===`image`||e.type===`link`)break}return s;function s(i){if(!o||!o._balanced)return n(i);let s=Bt(r.sliceSerialize({start:o.end,end:r.now()}));return s.codePointAt(0)!==94||!a.includes(s.slice(1))?n(i):(e.enter(`gfmFootnoteCallLabelMarker`),e.consume(i),e.exit(`gfmFootnoteCallLabelMarker`),t(i))}}function il(e,t){let n=e.length;for(;n--;)if(e[n][1].type===`labelImage`&&e[n][0]===`enter`){e[n][1];break}e[n+1][1].type=`data`,e[n+3][1].type=`gfmFootnoteCallLabelMarker`;let r={type:`gfmFootnoteCall`,start:Object.assign({},e[n+3][1].start),end:Object.assign({},e[e.length-1][1].end)},i={type:`gfmFootnoteCallMarker`,start:Object.assign({},e[n+3][1].end),end:Object.assign({},e[n+3][1].end)};i.end.column++,i.end.offset++,i.end._bufferIndex++;let a={type:`gfmFootnoteCallString`,start:Object.assign({},i.end),end:Object.assign({},e[e.length-1][1].start)},o={type:`chunkString`,contentType:`string`,start:Object.assign({},a.start),end:Object.assign({},a.end)},s=[e[n+1],e[n+2],[`enter`,r,t],e[n+3],e[n+4],[`enter`,i,t],[`exit`,i,t],[`enter`,a,t],[`enter`,o,t],[`exit`,o,t],[`exit`,a,t],e[e.length-2],e[e.length-1],[`exit`,r,t]];return e.splice(n,e.length-n+1,...s),e}function al(e,t,n){let r=this,i=r.parser.gfmFootnotes||(r.parser.gfmFootnotes=[]),a=0,o;return s;function s(t){return e.enter(`gfmFootnoteCall`),e.enter(`gfmFootnoteCallLabelMarker`),e.consume(t),e.exit(`gfmFootnoteCallLabelMarker`),c}function c(t){return t===94?(e.enter(`gfmFootnoteCallMarker`),e.consume(t),e.exit(`gfmFootnoteCallMarker`),e.enter(`gfmFootnoteCallString`),e.enter(`chunkString`).contentType=`string`,l):n(t)}function l(s){if(a>999||s===93&&!o||s===null||s===91||F(s))return n(s);if(s===93){e.exit(`chunkString`);let a=e.exit(`gfmFootnoteCallString`);return i.includes(Bt(r.sliceSerialize(a)))?(e.enter(`gfmFootnoteCallLabelMarker`),e.consume(s),e.exit(`gfmFootnoteCallLabelMarker`),e.exit(`gfmFootnoteCall`),t):n(s)}return F(s)||(o=!0),a++,e.consume(s),s===92?u:l}function u(t){return t===91||t===92||t===93?(e.consume(t),a++,l):l(t)}}function ol(e,t,n){let r=this,i=r.parser.gfmFootnotes||(r.parser.gfmFootnotes=[]),a,o=0,s;return c;function c(t){return e.enter(`gfmFootnoteDefinition`)._container=!0,e.enter(`gfmFootnoteDefinitionLabel`),e.enter(`gfmFootnoteDefinitionLabelMarker`),e.consume(t),e.exit(`gfmFootnoteDefinitionLabelMarker`),l}function l(t){return t===94?(e.enter(`gfmFootnoteDefinitionMarker`),e.consume(t),e.exit(`gfmFootnoteDefinitionMarker`),e.enter(`gfmFootnoteDefinitionLabelString`),e.enter(`chunkString`).contentType=`string`,u):n(t)}function u(t){if(o>999||t===93&&!s||t===null||t===91||F(t))return n(t);if(t===93){e.exit(`chunkString`);let n=e.exit(`gfmFootnoteDefinitionLabelString`);return a=Bt(r.sliceSerialize(n)),e.enter(`gfmFootnoteDefinitionLabelMarker`),e.consume(t),e.exit(`gfmFootnoteDefinitionLabelMarker`),e.exit(`gfmFootnoteDefinitionLabel`),f}return F(t)||(s=!0),o++,e.consume(t),t===92?d:u}function d(t){return t===91||t===92||t===93?(e.consume(t),o++,u):u(t)}function f(t){return t===58?(e.enter(`definitionMarker`),e.consume(t),e.exit(`definitionMarker`),i.includes(a)||i.push(a),L(e,p,`gfmFootnoteDefinitionWhitespace`)):n(t)}function p(e){return t(e)}}function sl(e,t,n){return e.check(pn,t,e.attempt(tl,t,n))}function cl(e){e.exit(`gfmFootnoteDefinition`)}function W(e,t,n){let r=this;return L(e,i,`gfmFootnoteDefinitionIndent`,5);function i(e){let i=r.events[r.events.length-1];return i&&i[1].type===`gfmFootnoteDefinitionIndent`&&i[2].sliceSerialize(i[1],!0).length===4?t(e):n(e)}}function ll(e){let t=(e||{}).singleTilde,n={name:`strikethrough`,tokenize:i,resolveAll:r};return t??=!0,{text:{126:n},insideSpan:{null:[n]},attentionMarkers:{null:[126]}};function r(e,t){let n=-1;for(;++n<e.length;)if(e[n][0]===`enter`&&e[n][1].type===`strikethroughSequenceTemporary`&&e[n][1]._close){let r=n;for(;r--;)if(e[r][0]===`exit`&&e[r][1].type===`strikethroughSequenceTemporary`&&e[r][1]._open&&e[n][1].end.offset-e[n][1].start.offset===e[r][1].end.offset-e[r][1].start.offset){e[n][1].type=`strikethroughSequence`,e[r][1].type=`strikethroughSequence`;let i={type:`strikethrough`,start:Object.assign({},e[r][1].start),end:Object.assign({},e[n][1].end)},a={type:`strikethroughText`,start:Object.assign({},e[r][1].end),end:Object.assign({},e[n][1].start)},o=[[`enter`,i,t],[`enter`,e[r][1],t],[`exit`,e[r][1],t],[`enter`,a,t]],s=t.parser.constructs.insideSpan.null;s&&Nt(o,o.length,0,on(s,e.slice(r+1,n),t)),Nt(o,o.length,0,[[`exit`,a,t],[`enter`,e[n][1],t],[`exit`,e[n][1],t],[`exit`,i,t]]),Nt(e,r-1,n-r+3,o),n=r+o.length-2;break}}for(n=-1;++n<e.length;)e[n][1].type===`strikethroughSequenceTemporary`&&(e[n][1].type=`data`);return e}function i(e,n,r){let i=this.previous,a=this.events,o=0;return s;function s(t){return i===126&&a[a.length-1][1].type!==`characterEscape`?r(t):(e.enter(`strikethroughSequenceTemporary`),c(t))}function c(a){let s=an(i);if(a===126)return o>1?r(a):(e.consume(a),o++,c);if(o<2&&!t)return r(a);let l=e.exit(`strikethroughSequenceTemporary`),u=an(a);return l._open=!u||u===2&&!!s,l._close=!s||s===2&&!!u,n(a)}}}var ul=class{constructor(){this.map=[]}add(e,t,n){dl(this,e,t,n)}consume(e){if(this.map.sort(function(e,t){return e[0]-t[0]}),this.map.length===0)return;let t=this.map.length,n=[];for(;t>0;)--t,n.push(e.slice(this.map[t][0]+this.map[t][1]),this.map[t][2]),e.length=this.map[t][0];n.push(e.slice()),e.length=0;let r=n.pop();for(;r;){for(let t of r)e.push(t);r=n.pop()}this.map.length=0}};function dl(e,t,n,r){let i=0;if(!(n===0&&r.length===0)){for(;i<e.map.length;){if(e.map[i][0]===t){e.map[i][1]+=n,e.map[i][2].push(...r);return}i+=1}e.map.push([t,n,r])}}function fl(e,t){let n=!1,r=[];for(;t<e.length;){let i=e[t];if(n){if(i[0]===`enter`)i[1].type===`tableContent`&&r.push(e[t+1][1].type===`tableDelimiterMarker`?`left`:`none`);else if(i[1].type===`tableContent`){if(e[t-1][1].type===`tableDelimiterMarker`){let e=r.length-1;r[e]=r[e]===`left`?`center`:`right`}}else if(i[1].type===`tableDelimiterRow`)break}else i[0]===`enter`&&i[1].type===`tableDelimiterRow`&&(n=!0);t+=1}return r}function pl(){return{flow:{null:{name:`table`,tokenize:ml,resolveAll:hl}}}}function ml(e,t,n){let r=this,i=0,a=0,o;return s;function s(e){let t=r.events.length-1;for(;t>-1;){let e=r.events[t][1].type;if(e===`lineEnding`||e===`linePrefix`)t--;else break}let i=t>-1?r.events[t][1].type:null,a=i===`tableHead`||i===`tableRow`?S:c;return a===S&&r.parser.lazy[r.now().line]?n(e):a(e)}function c(t){return e.enter(`tableHead`),e.enter(`tableRow`),l(t)}function l(e){return e===124?u(e):(o=!0,a+=1,u(e))}function u(t){return t===null?n(t):P(t)?a>1?(a=0,r.interrupt=!0,e.exit(`tableRow`),e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),p):n(t):I(t)?L(e,u,`whitespace`)(t):(a+=1,o&&(o=!1,i+=1),t===124?(e.enter(`tableCellDivider`),e.consume(t),e.exit(`tableCellDivider`),o=!0,u):(e.enter(`data`),d(t)))}function d(t){return t===null||t===124||F(t)?(e.exit(`data`),u(t)):(e.consume(t),t===92?f:d)}function f(t){return t===92||t===124?(e.consume(t),d):d(t)}function p(t){return r.interrupt=!1,r.parser.lazy[r.now().line]?n(t):(e.enter(`tableDelimiterRow`),o=!1,I(t)?L(e,m,`linePrefix`,r.parser.constructs.disable.null.includes(`codeIndented`)?void 0:4)(t):m(t))}function m(t){return t===45||t===58?g(t):t===124?(o=!0,e.enter(`tableCellDivider`),e.consume(t),e.exit(`tableCellDivider`),h):x(t)}function h(t){return I(t)?L(e,g,`whitespace`)(t):g(t)}function g(t){return t===58?(a+=1,o=!0,e.enter(`tableDelimiterMarker`),e.consume(t),e.exit(`tableDelimiterMarker`),_):t===45?(a+=1,_(t)):t===null||P(t)?b(t):x(t)}function _(t){return t===45?(e.enter(`tableDelimiterFiller`),v(t)):x(t)}function v(t){return t===45?(e.consume(t),v):t===58?(o=!0,e.exit(`tableDelimiterFiller`),e.enter(`tableDelimiterMarker`),e.consume(t),e.exit(`tableDelimiterMarker`),y):(e.exit(`tableDelimiterFiller`),y(t))}function y(t){return I(t)?L(e,b,`whitespace`)(t):b(t)}function b(n){return n===124?m(n):n===null||P(n)?!o||i!==a?x(n):(e.exit(`tableDelimiterRow`),e.exit(`tableHead`),t(n)):x(n)}function x(e){return n(e)}function S(t){return e.enter(`tableRow`),C(t)}function C(n){return n===124?(e.enter(`tableCellDivider`),e.consume(n),e.exit(`tableCellDivider`),C):n===null||P(n)?(e.exit(`tableRow`),t(n)):I(n)?L(e,C,`whitespace`)(n):(e.enter(`data`),w(n))}function w(t){return t===null||t===124||F(t)?(e.exit(`data`),C(t)):(e.consume(t),t===92?T:w)}function T(t){return t===92||t===124?(e.consume(t),w):w(t)}}function hl(e,t){let n=-1,r=!0,i=0,a=[0,0,0,0],o=[0,0,0,0],s=!1,c=0,l,u,d,f=new ul;for(;++n<e.length;){let p=e[n],m=p[1];p[0]===`enter`?m.type===`tableHead`?(s=!1,c!==0&&(_l(f,t,c,l,u),u=void 0,c=0),l={type:`table`,start:Object.assign({},m.start),end:Object.assign({},m.end)},f.add(n,0,[[`enter`,l,t]])):m.type===`tableRow`||m.type===`tableDelimiterRow`?(r=!0,d=void 0,a=[0,0,0,0],o=[0,n+1,0,0],s&&(s=!1,u={type:`tableBody`,start:Object.assign({},m.start),end:Object.assign({},m.end)},f.add(n,0,[[`enter`,u,t]])),i=m.type===`tableDelimiterRow`?2:u?3:1):i&&(m.type===`data`||m.type===`tableDelimiterMarker`||m.type===`tableDelimiterFiller`)?(r=!1,o[2]===0&&(a[1]!==0&&(o[0]=o[1],d=gl(f,t,a,i,void 0,d),a=[0,0,0,0]),o[2]=n)):m.type===`tableCellDivider`&&(r?r=!1:(a[1]!==0&&(o[0]=o[1],d=gl(f,t,a,i,void 0,d)),a=o,o=[a[1],n,0,0])):m.type===`tableHead`?(s=!0,c=n):m.type===`tableRow`||m.type===`tableDelimiterRow`?(c=n,a[1]===0?o[1]!==0&&(d=gl(f,t,o,i,n,d)):(o[0]=o[1],d=gl(f,t,a,i,n,d)),i=0):i&&(m.type===`data`||m.type===`tableDelimiterMarker`||m.type===`tableDelimiterFiller`)&&(o[3]=n)}for(c!==0&&_l(f,t,c,l,u),f.consume(t.events),n=-1;++n<t.events.length;){let e=t.events[n];e[0]===`enter`&&e[1].type===`table`&&(e[1]._align=fl(t.events,n))}return e}function gl(e,t,n,r,i,a){let o=r===1?`tableHeader`:r===2?`tableDelimiter`:`tableData`;n[0]!==0&&(a.end=Object.assign({},vl(t.events,n[0])),e.add(n[0],0,[[`exit`,a,t]]));let s=vl(t.events,n[1]);if(a={type:o,start:Object.assign({},s),end:Object.assign({},s)},e.add(n[1],0,[[`enter`,a,t]]),n[2]!==0){let i=vl(t.events,n[2]),a=vl(t.events,n[3]),o={type:`tableContent`,start:Object.assign({},i),end:Object.assign({},a)};if(e.add(n[2],0,[[`enter`,o,t]]),r!==2){let r=t.events[n[2]],i=t.events[n[3]];if(r[1].end=Object.assign({},i[1].end),r[1].type=`chunkText`,r[1].contentType=`text`,n[3]>n[2]+1){let t=n[2]+1,r=n[3]-n[2]-1;e.add(t,r,[])}}e.add(n[3]+1,0,[[`exit`,o,t]])}return i!==void 0&&(a.end=Object.assign({},vl(t.events,i)),e.add(i,0,[[`exit`,a,t]]),a=void 0),a}function _l(e,t,n,r,i){let a=[],o=vl(t.events,n);i&&(i.end=Object.assign({},o),a.push([`exit`,i,t])),r.end=Object.assign({},o),a.push([`exit`,r,t]),e.add(n+1,0,a)}function vl(e,t){let n=e[t],r=n[0]===`enter`?`start`:`end`;return n[1][r]}var yl={name:`tasklistCheck`,tokenize:xl};function bl(){return{text:{91:yl}}}function xl(e,t,n){let r=this;return i;function i(t){return r.previous!==null||!r._gfmTasklistFirstContentOfListItem?n(t):(e.enter(`taskListCheck`),e.enter(`taskListCheckMarker`),e.consume(t),e.exit(`taskListCheckMarker`),a)}function a(t){return F(t)?(e.enter(`taskListCheckValueUnchecked`),e.consume(t),e.exit(`taskListCheckValueUnchecked`),o):t===88||t===120?(e.enter(`taskListCheckValueChecked`),e.consume(t),e.exit(`taskListCheckValueChecked`),o):n(t)}function o(t){return t===93?(e.enter(`taskListCheckMarker`),e.consume(t),e.exit(`taskListCheckMarker`),e.exit(`taskListCheck`),s):n(t)}function s(r){return P(r)?t(r):I(r)?e.check({tokenize:Sl},t,n)(r):n(r)}}function Sl(e,t,n){return L(e,r,`whitespace`);function r(e){return e===null?n(e):t(e)}}function Cl(e){return It([Bc(),nl(),ll(e),pl(),bl()])}var wl={};function Tl(e){let t=this,n=e||wl,r=t.data(),i=r.micromarkExtensions||=[],a=r.fromMarkdownExtensions||=[],o=r.toMarkdownExtensions||=[];i.push(Cl(n)),a.push(Ac()),o.push(jc(n))}var El=`
.sx-md-viewer { color: var(--sx-text); }
.sx-md-viewer .sx-md-head { margin-bottom: 18px; }
.sx-md-viewer .sx-md-head h2 { font-size: 20px; margin: 0 0 4px; }
.sx-md-viewer .sx-md-head p { font-size: 13px; color: var(--sx-text-soft); margin: 0; }

.sx-md-meta {
  display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
  margin-bottom: 18px; padding: 8px 14px;
  background: var(--sx-bg-elev); border: 1px solid var(--sx-border);
  border-radius: var(--sx-radius-sm);
  font-family: var(--sx-mono); font-size: 12px; color: var(--sx-text-soft);
}
.sx-md-meta__chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 4px;
  background: var(--sx-bg-soft); border: 1px solid var(--sx-border);
}
.sx-md-meta__chip strong { color: var(--sx-accent-strong); font-weight: 600; }

.sx-md-body { font-size: 15px; line-height: 1.75; word-break: break-word; }
.sx-md-body > *:first-child { margin-top: 0; }
.sx-md-body > *:last-child { margin-bottom: 0; }
.sx-md-body h1, .sx-md-body h2, .sx-md-body h3, .sx-md-body h4 {
  color: var(--sx-text-h); font-weight: 600; letter-spacing: -0.01em;
  margin: 28px 0 12px; line-height: 1.3;
}
.sx-md-body h1 { font-size: 26px; padding-bottom: 8px; border-bottom: 1px solid var(--sx-border); }
.sx-md-body h2 { font-size: 21px; padding-bottom: 6px; border-bottom: 1px solid var(--sx-border); }
.sx-md-body h3 { font-size: 17px; }
.sx-md-body h4 { font-size: 15px; color: var(--sx-accent-strong); }
.sx-md-body p { margin: 0 0 14px; }
.sx-md-body a { color: var(--sx-accent-strong); text-decoration: underline; text-underline-offset: 2px; }
.sx-md-body a:hover { color: var(--sx-accent); }
.sx-md-body strong { color: var(--sx-text-h); font-weight: 600; }
.sx-md-body em { color: var(--sx-cyan); font-style: italic; }
.sx-md-body ul, .sx-md-body ol { margin: 0 0 14px; padding-left: 22px; }
.sx-md-body li { margin: 4px 0; }
.sx-md-body li::marker { color: var(--sx-accent); }
.sx-md-body blockquote {
  margin: 0 0 14px; padding: 10px 16px;
  border-left: 3px solid var(--sx-accent);
  background: var(--sx-accent-bg); border-radius: 0 var(--sx-radius-sm) var(--sx-radius-sm) 0;
  color: var(--sx-text);
}
.sx-md-body blockquote p { margin: 0; }
.sx-md-body code {
  font-family: var(--sx-mono); font-size: 0.86em;
  background: rgba(255,255,255,0.06); color: var(--sx-cyan);
  padding: 1px 6px; border-radius: 4px;
}
.sx-md-body pre {
  margin: 0 0 16px; padding: 16px 18px;
  background: var(--sx-bg-soft); border: 1px solid var(--sx-border);
  border-radius: var(--sx-radius); overflow-x: auto;
}
.sx-md-body pre code {
  background: transparent; color: var(--sx-text); padding: 0;
  font-size: 13px; line-height: 1.6;
}
.sx-md-body table {
  width: 100%; border-collapse: collapse; margin: 0 0 16px;
  font-size: 14px; display: block; overflow-x: auto;
}
.sx-md-body th, .sx-md-body td {
  padding: 8px 12px; border: 1px solid var(--sx-border-strong); text-align: left;
}
.sx-md-body th { background: var(--sx-bg-elev); color: var(--sx-text-h); font-weight: 600; }
.sx-md-body tr:nth-child(even) td { background: var(--sx-bg-soft); }
.sx-md-body hr { border: none; border-top: 1px dashed var(--sx-border-strong); margin: 24px 0; }
.sx-md-body img { max-width: 100%; border-radius: var(--sx-radius-sm); }
.sx-md-body del { color: var(--sx-text-soft); }
.sx-md-body input[type="checkbox"] { accent-color: var(--sx-accent); margin-right: 6px; }
`;function Dl(e){if(!e)return{chars:0,headings:0,codeBlocks:0};let t=e.length,n=(e.match(/^#{1,6}\s+/gm)||[]).length,r=(e.match(/```/g)||[]).length/2;return{chars:t,headings:n,codeBlocks:Math.floor(r)}}var Ol=[Tl];function kl({content:e=``,title:t,subtitle:n}){let r=(0,b.useMemo)(()=>Dl(e),[e]);return(0,S.jsxs)(`div`,{className:`sx-md-viewer`,children:[(0,S.jsx)(`style`,{children:El}),(t||n)&&(0,S.jsxs)(`div`,{className:`sx-md-head`,children:[t&&(0,S.jsx)(`h2`,{children:t}),n&&(0,S.jsx)(`p`,{children:n})]}),(0,S.jsxs)(`div`,{className:`sx-md-meta`,children:[(0,S.jsxs)(`span`,{className:`sx-md-meta__chip`,children:[`字符 `,(0,S.jsx)(`strong`,{children:r.chars.toLocaleString()})]}),(0,S.jsxs)(`span`,{className:`sx-md-meta__chip`,children:[`标题 `,(0,S.jsx)(`strong`,{children:r.headings})]}),(0,S.jsxs)(`span`,{className:`sx-md-meta__chip`,children:[`代码块 `,(0,S.jsx)(`strong`,{children:r.codeBlocks})]})]}),(0,S.jsx)(`div`,{className:`sx-md-body`,children:(0,S.jsx)(Co,{remarkPlugins:Ol,children:e})})]})}var Al=(0,b.memo)(kl),jl=(0,b.createContext)(null),Ml=0,Nl={info:`ℹ`,warn:`⚠`,error:`✕`,success:`✓`};function Pl({children:e}){let[t,n]=(0,b.useState)([]),r=(0,b.useRef)(new Map),i=(0,b.useCallback)(e=>{n(t=>t.filter(t=>t.id!==e));let t=r.current.get(e);t&&(clearTimeout(t),r.current.delete(e))},[]),a=(0,b.useCallback)((e,t=`info`)=>{let a=++Ml;n(n=>[...n,{id:a,message:e,type:t}]);let o=setTimeout(()=>i(a),3e3);return r.current.set(a,o),a},[i]),o=(0,b.useMemo)(()=>({showToast:a,dismiss:i}),[a,i]);return(0,S.jsxs)(jl.Provider,{value:o,children:[e,(0,S.jsx)(`div`,{className:`sx-toast-wrap`,"aria-live":`polite`,"aria-atomic":`true`,children:t.map(e=>(0,S.jsxs)(`div`,{className:`sx-toast sx-toast--${e.type}`,role:`status`,onClick:()=>i(e.id),children:[(0,S.jsx)(`span`,{"aria-hidden":`true`,style:{marginRight:8},children:Nl[e.type]||`•`}),e.message]},e.id))})]})}function Fl(){let e=(0,b.useContext)(jl);if(!e){let e=()=>{};return{showToast:e,dismiss:e}}return e}var Il=`
.sx-sandbox {
  margin-top: 40px;
  background: var(--sx-bg-soft);
  border: 1px solid var(--sx-border-strong);
  border-radius: var(--sx-radius-lg);
  overflow: hidden;
  animation: sx-fade-up 360ms cubic-bezier(0.22,0.61,0.36,1) both;
}
.sx-sandbox__header {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 16px 20px;
  background: var(--sx-bg-elev);
  border-bottom: 1px solid var(--sx-border);
}
.sx-sandbox__tag {
  font-family: var(--sx-mono); font-size: 11px;
  color: var(--sx-cyan); background: var(--sx-cyan-bg);
  border: 1px solid var(--sx-cyan-border);
  padding: 2px 8px; border-radius: 4px;
}
.sx-sandbox__title { font-size: 17px; color: var(--sx-text-h); margin: 0; flex: 1; min-width: 120px; }
.sx-sandbox__path {
  font-family: var(--sx-mono); font-size: 12px; color: var(--sx-text-soft);
  word-break: break-all;
}
.sx-sandbox__panes {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
  background: var(--sx-border);
}
.sx-sandbox__pane { background: var(--sx-bg-soft); display: flex; flex-direction: column; min-width: 0; }
.sx-sandbox__pane--brief { padding: 0; }
.sx-sandbox__pane--live { padding: 0; }
.sx-sandbox__pane-head {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 10px 16px; background: var(--sx-bg-elev);
  border-bottom: 1px solid var(--sx-border);
  font-family: var(--sx-mono); font-size: 12px; color: var(--sx-text-soft);
}
.sx-sandbox__pane-body { padding: 18px 20px; flex: 1; overflow: auto; }
.sx-sandbox__demo { padding: 18px 20px; border-bottom: 1px solid var(--sx-border); }
.sx-sandbox__demo-label {
  font-family: var(--sx-mono); font-size: 11px; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--sx-cyan); margin-bottom: 12px;
}
.sx-sandbox__code {
  margin: 0; padding: 16px; overflow: auto;
  font-family: var(--sx-mono); font-size: 12.5px; line-height: 1.65;
  background: var(--sx-bg); color: var(--sx-text);
}
.sx-sandbox__code .tok-key { color: var(--sx-accent-strong); }
.sx-sandbox__code .tok-str { color: var(--sx-green); }
.sx-sandbox__code .tok-com { color: var(--sx-text-soft); font-style: italic; }
.sx-sandbox__code .tok-num { color: var(--sx-cyan); }
.sx-sandbox__code .tok-fn  { color: var(--sx-cyan); }
.sx-sandbox__btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
  border: 1px solid transparent; cursor: pointer; font-family: inherit;
  transition: background 180ms, border-color 180ms, opacity 180ms;
}
.sx-sandbox__btn--ghost {
  background: transparent; border-color: var(--sx-border-strong); color: var(--sx-text-soft);
}
.sx-sandbox__btn--ghost:hover { color: var(--sx-text-h); border-color: var(--sx-text-soft); }
.sx-sandbox__btn--primary { background: var(--sx-accent); color: #0c0a09; }
.sx-sandbox__btn--primary:hover { background: var(--sx-accent-strong); }
.sx-sandbox__btn--success { background: var(--sx-green); color: #06140a; }
.sx-sandbox__btn--success:hover { filter: brightness(1.1); }
.sx-sandbox__btn:disabled { opacity: 0.55; cursor: not-allowed; }
.sx-sandbox__commit {
  display: flex; flex-direction: column; gap: 10px;
  margin-top: 12px; padding: 14px;
  background: var(--sx-bg-elev); border: 1px solid var(--sx-border);
  border-radius: var(--sx-radius);
}
.sx-sandbox__commit textarea {
  width: 100%; min-height: 70px; resize: vertical;
  padding: 10px 12px; font-family: var(--sx-mono); font-size: 13px;
  background: var(--sx-bg-soft); color: var(--sx-text-h);
  border: 1px solid var(--sx-border-strong); border-radius: var(--sx-radius-sm);
  outline: none;
}
.sx-sandbox__commit textarea:focus { border-color: var(--sx-accent); }
.sx-sandbox__commit-actions { display: flex; gap: 8px; justify-content: flex-end; }
@media (max-width: 860px) {
  .sx-sandbox__panes { grid-template-columns: 1fr; }
}
`,Ll=new Set(`const.let.var.function.return.if.else.for.while.do.switch.case.break.continue.default.new.class.extends.super.this.import.export.from.as.default.async.await.try.catch.finally.throw.typeof.instanceof.in.of.delete.void.yield.static.get.set.true.false.null.undefined.console.window.document`.split(`.`));function Rl(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")|\b([A-Za-z_$][A-Za-z0-9_$]*)\b(\s*\()?|(\b\d[\d_.eE]*\b)/g,(e,t,n,r,i,a)=>t?`<span class="tok-com">${t}</span>`:n?`<span class="tok-str">${n}</span>`:r?Ll.has(r)?`<span class="tok-key">${r}</span>${i||``}`:i?`<span class="tok-fn">${r}</span>${i}`:r:a?`<span class="tok-num">${a}</span>`:e)}function zl({title:e,tag:t,filePath:n,instructionMd:r,sourceCode:i,TargetComponent:a,onClose:o,onSolved:s,onSubmitPR:c}){let{showToast:l}=Fl(),[u,d]=(0,b.useState)(!1),[f,p]=(0,b.useState)(!1),[m,h]=(0,b.useState)(``),[g,_]=(0,b.useState)(!1),v=Rl(i||``);function y(){d(!0),s?.(),l(`已标记为完成`,`success`)}async function x(){if(!c)return;let e=m.trim();if(!e){l(`请填写 commit message`,`warn`);return}_(!0);try{let t=await c(e);t?(l(`PR 已创建,正在打开…`,`success`),window.open(t,`_blank`,`noopener,noreferrer`)):p(!1)}catch(e){l(e?.message||`提交 PR 失败`,`error`)}finally{_(!1)}}return(0,S.jsxs)(`div`,{className:w(`sx-sandbox`),children:[(0,S.jsx)(`style`,{children:Il}),(0,S.jsxs)(`div`,{className:`sx-sandbox__header`,children:[t&&(0,S.jsx)(`span`,{className:`sx-sandbox__tag`,children:t}),(0,S.jsx)(`h3`,{className:`sx-sandbox__title`,children:e}),n&&(0,S.jsx)(`span`,{className:`sx-sandbox__path`,children:n}),(0,S.jsx)(`button`,{type:`button`,className:`sx-sandbox__btn sx-sandbox__btn--ghost`,onClick:o,children:`✕ 关闭`})]}),(0,S.jsxs)(`div`,{className:`sx-sandbox__panes`,children:[(0,S.jsxs)(`div`,{className:`sx-sandbox__pane sx-sandbox__pane--brief`,children:[(0,S.jsxs)(`div`,{className:`sx-sandbox__pane-head`,children:[(0,S.jsx)(`span`,{children:`任务说明`}),(0,S.jsx)(`button`,{type:`button`,className:`sx-sandbox__btn sx-sandbox__btn--success`,onClick:y,disabled:u,children:u?`✓ 已完成`:`标记完成`})]}),(0,S.jsx)(`div`,{className:`sx-sandbox__pane-body`,children:r?(0,S.jsx)(Al,{content:r}):(0,S.jsx)(`p`,{style:{color:`var(--sx-text-soft)`},children:`暂无任务说明。`})})]}),(0,S.jsxs)(`div`,{className:`sx-sandbox__pane sx-sandbox__pane--live`,children:[(0,S.jsxs)(`div`,{className:`sx-sandbox__pane-head`,children:[(0,S.jsx)(`span`,{children:`实时 Demo + 源码`}),(0,S.jsx)(`button`,{type:`button`,className:`sx-sandbox__btn sx-sandbox__btn--primary`,onClick:()=>p(e=>!e),children:f?`收起`:`提交 PR →`})]}),(0,S.jsxs)(`div`,{className:`sx-sandbox__demo`,children:[(0,S.jsx)(`div`,{className:`sx-sandbox__demo-label`,children:`Live Demo`}),a?(0,S.jsx)(a,{}):null]}),(0,S.jsx)(`div`,{className:`sx-sandbox__pane-head`,style:{borderTop:`1px solid var(--sx-border)`,borderBottom:`1px solid var(--sx-border)`},children:(0,S.jsxs)(`span`,{children:[`源码 `,n?`· ${n.split(`/`).pop()}`:``]})}),(0,S.jsx)(`pre`,{className:`sx-sandbox__code`,dangerouslySetInnerHTML:{__html:v}}),f&&(0,S.jsxs)(`div`,{className:`sx-sandbox__commit`,children:[(0,S.jsx)(`textarea`,{placeholder:`commit message: 例如 fix(state): 修复 Context 全局重渲染`,value:m,onChange:e=>h(e.target.value),autoFocus:!0}),(0,S.jsxs)(`div`,{className:`sx-sandbox__commit-actions`,children:[(0,S.jsx)(`button`,{type:`button`,className:`sx-sandbox__btn sx-sandbox__btn--ghost`,onClick:()=>p(!1),disabled:g,children:`取消`}),(0,S.jsx)(`button`,{type:`button`,className:`sx-sandbox__btn sx-sandbox__btn--primary`,onClick:x,disabled:g,children:g?`提交中…`:`创建 PR`})]})]})]})]})]})}var G=[{id:1,title:`JSON 序列化策略实战`,category:`Serialization`,difficulty:`Easy`,author:`Official`,sandboxId:`json-serialization`,group:`data-processing`,tags:[`JSON`,`Parsing`,`Validation`],description:`JSON 序列化的边界情况、深拷贝陷阱、循环引用处理与崩溃防御。`,estimatedTime:`15-30 min`},{id:2,title:`React 状态管理实战`,category:`State Management`,difficulty:`Medium`,author:`Official`,sandboxId:`state-management`,group:`react-patterns`,tags:[`useState`,`useReducer`,`Context`],description:`练习 useState / useReducer / useContext，修复直接 mutation 和 Context 性能问题。`,estimatedTime:`20-30 min`},{id:3,title:`异步数据处理实战`,category:`Async`,difficulty:`Medium`,author:`Official`,sandboxId:`async-data`,group:`data-processing`,tags:[`async/await`,`AbortController`,`Race Condition`],description:`练习 async/await、AbortController、竞态条件处理和内存泄漏防护。`,estimatedTime:`20-30 min`},{id:4,title:`表单验证实战`,category:`Form`,difficulty:`Easy`,author:`Official`,sandboxId:`form-validation`,group:`react-patterns`,tags:[`Forms`,`Validation`,`Controlled`],description:`练习受控组件、表单验证逻辑和密码强度检测。`,estimatedTime:`15-25 min`},{id:5,title:`useEffect 深度解析`,category:`Hooks`,difficulty:`Medium`,author:`Official`,sandboxId:`use-effect`,group:`react-patterns`,tags:[`useEffect`,`Cleanup`,`Dependency`],description:`理解 Effect 生命周期、依赖数组、清理函数，修复竞态和内存泄漏。`,estimatedTime:`20-35 min`},{id:6,title:`Context 性能优化`,category:`Performance`,difficulty:`Hard`,author:`Official`,sandboxId:`context-perf`,group:`react-patterns`,tags:[`Context`,`memo`,`Split`],description:`诊断 Context 导致的全局重渲染，掌握拆分 Context 和 memo 优化。`,estimatedTime:`25-40 min`},{id:7,title:`防抖与节流实战`,category:`Optimization`,difficulty:`Medium`,author:`Official`,sandboxId:`debounce-throttle`,group:`data-processing`,tags:[`debounce`,`throttle`,`Performance`],description:`从零实现 debounce / throttle，理解区别和适用场景。`,estimatedTime:`15-25 min`},{id:8,title:`React.memo 优化实战`,category:`Performance`,difficulty:`Hard`,author:`Official`,sandboxId:`memo-optimization`,group:`performance`,tags:[`memo`,`useMemo`,`useCallback`],description:`诊断不必要的重渲染，使用 memo / useMemo / useCallback 优化组件树。`,estimatedTime:`25-40 min`},{id:9,title:`虚拟列表实现`,category:`Virtualization`,difficulty:`Hard`,author:`Official`,sandboxId:`virtual-list`,group:`performance`,tags:[`Virtual Scroll`,`DOM`,`Rendering`],description:`从零实现虚拟滚动列表，理解窗口化渲染原理和 DOM 回收策略。`,estimatedTime:`30-45 min`},{id:10,title:`组件性能优化`,category:`Performance`,difficulty:`Hard`,author:`Community`,sandboxId:null,group:`performance`,tags:[`memo`,`useMemo`,`Virtualization`],description:`优化渲染性能，减少不必要的重渲染，实现列表虚拟化。`,estimatedTime:`30-45 min`},{id:11,title:`TypeScript 类型体操`,category:`TypeScript`,difficulty:`Hard`,author:`Community`,sandboxId:null,group:`react-patterns`,tags:[`Generics`,`Utility Types`,`Inference`],description:`高级 TypeScript 类型编程，实现类型安全的 API 设计。`,estimatedTime:`25-40 min`},{id:12,title:`测试驱动开发实战`,category:`Testing`,difficulty:`Medium`,author:`Official`,sandboxId:null,group:`react-patterns`,tags:[`Jest`,`Testing Library`,`TDD`],description:`编写单元测试、集成测试和 E2E 测试。`,estimatedTime:`25-40 min`}],K=[{id:`all`,name:`全部`},{id:`Serialization`,name:`序列化`},{id:`State Management`,name:`状态管理`},{id:`Async`,name:`异步处理`},{id:`Form`,name:`表单`},{id:`Hooks`,name:`Hooks`},{id:`Performance`,name:`性能优化`},{id:`Optimization`,name:`优化技巧`},{id:`Virtualization`,name:`虚拟化`},{id:`TypeScript`,name:`TypeScript`},{id:`Testing`,name:`测试`}],q={Easy:{color:`#22c55e`,bg:`rgba(34, 197, 94, 0.1)`,label:`简单`},Medium:{color:`#f59e0b`,bg:`rgba(245, 158, 11, 0.1)`,label:`中等`},Hard:{color:`#ef4444`,bg:`rgba(239, 68, 68, 0.1)`,label:`困难`}},J={Todo:{icon:`○`,color:`#8b8fa3`,label:`待完成`},Solved:{icon:`✓`,color:`#22c55e`,label:`已完成`},Skipped:{icon:`—`,color:`#6b7280`,label:`已跳过`}},Y={Easy:1,Medium:2,Hard:3},Bl={Todo:1,Solved:2,Skipped:3},Vl=[{key:`title`,label:`Title`},{key:`category`,label:`Category`},{key:`difficulty`,label:`Difficulty`},{key:`author`,label:`Author`},{key:`estimatedTime`,label:`Time`},{key:`status`,label:`Status`}];function Hl(e){return J[e]?.label||J.Todo.label}function Ul({sandboxes:e=[],onOpen:t,onMarkSolved:n}){let[r,i]=(0,b.useState)(``),[a,o]=(0,b.useState)(`all`),[s,c]=(0,b.useState)(`all`),[l,u]=(0,b.useState)(`all`),[d,f]=(0,b.useState)({key:`id`,dir:`asc`}),p=(0,b.useMemo)(()=>{let t=r.trim().toLowerCase(),n=e.filter(e=>{if(t&&!`${e.title} ${e.category} ${(e.tags||[]).join(` `)} ${e.description||``}`.toLowerCase().includes(t)||a!==`all`&&e.category!==a||s!==`all`&&e.difficulty!==s)return!1;let n=e.status||`Todo`;return!(l!==`all`&&n!==l)});return n=[...n].sort((e,t)=>{let{key:n,dir:r}=d,i,a;return n===`difficulty`?(i=Y[e.difficulty]||0,a=Y[t.difficulty]||0):n===`status`?(i=Bl[e.status||`Todo`]||0,a=Bl[t.status||`Todo`]||0):n===`estimatedTime`?(i=parseInt(String(e.estimatedTime).replace(/\D/g,``),10)||0,a=parseInt(String(t.estimatedTime).replace(/\D/g,``),10)||0):(i=String(e[n]??``).toLowerCase(),a=String(t[n]??``).toLowerCase()),i<a?r===`asc`?-1:1:i>a?r===`asc`?1:-1:0}),n},[e,r,a,s,l,d]);function m(e){f(t=>t.key===e?{key:e,dir:t.dir===`asc`?`desc`:`asc`}:{key:e,dir:`asc`})}let h=e=>d.key===e?d.dir===`asc`?` ▲`:` ▼`:``;return(0,S.jsxs)(`section`,{className:`sx-sandbox-list`,"aria-label":`靶场列表`,children:[(0,S.jsxs)(`div`,{className:`sx-sandbox-list__head`,children:[(0,S.jsx)(`h2`,{className:`sx-sandbox-list__title`,children:`靶场列表`}),(0,S.jsxs)(`div`,{className:`sx-sandbox-list__filters`,children:[(0,S.jsx)(`select`,{className:`sx-sandbox-list__filter`,value:a,onChange:e=>o(e.target.value),"aria-label":`分类筛选`,children:K.map(e=>(0,S.jsx)(`option`,{value:e.id,children:e.name},e.id))}),[`all`,`Easy`,`Medium`,`Hard`].map(e=>(0,S.jsx)(`button`,{type:`button`,className:w(`sx-sandbox-list__filter`,s===e&&`is-active`),onClick:()=>c(e),children:e===`all`?`全部难度`:q[e]?.label||e},e)),[`all`,`Todo`,`Solved`].map(e=>(0,S.jsx)(`button`,{type:`button`,className:w(`sx-sandbox-list__filter`,l===e&&`is-active`),onClick:()=>u(e),children:e===`all`?`全部状态`:J[e]?.label||e},e)),(0,S.jsx)(`input`,{type:`search`,className:`sx-sandbox-list__search`,placeholder:`搜索标题 / 标签…`,value:r,onChange:e=>i(e.target.value),"aria-label":`搜索靶场`})]})]}),(0,S.jsx)(`div`,{className:`sx-sandbox-list__table-wrap`,children:(0,S.jsxs)(`table`,{className:`sx-sandbox-list__table`,children:[(0,S.jsx)(`thead`,{children:(0,S.jsxs)(`tr`,{children:[(0,S.jsx)(`th`,{className:`sx-sandbox-list__th`,children:`#`}),Vl.map(e=>(0,S.jsxs)(`th`,{className:`sx-sandbox-list__th`,style:{cursor:`pointer`,userSelect:`none`},onClick:()=>m(e.key),title:`按 ${e.label} 排序`,children:[e.label,h(e.key)]},e.key)),(0,S.jsx)(`th`,{className:`sx-sandbox-list__th`,children:`操作`})]})}),(0,S.jsxs)(`tbody`,{children:[p.map((e,r)=>{let i=e.sandboxId==null,a=e.status||`Todo`;return(0,S.jsxs)(`tr`,{className:`sx-sandbox-list__tr`,style:i?{opacity:.5,cursor:`not-allowed`}:void 0,onClick:()=>!i&&t?.(e.sandboxId),title:e.description,children:[(0,S.jsx)(`td`,{className:`sx-sandbox-list__td`,children:r+1}),(0,S.jsx)(`td`,{className:`sx-sandbox-list__td sx-sandbox-list__td--title`,children:e.title}),(0,S.jsx)(`td`,{className:`sx-sandbox-list__td`,children:e.category}),(0,S.jsx)(`td`,{className:`sx-sandbox-list__td`,children:e.difficulty&&(0,S.jsx)(`span`,{className:w(`sx-sandbox-list__badge`,`sx-sandbox-list__badge--${e.difficulty.toLowerCase()}`),children:q[e.difficulty]?.label||e.difficulty})}),(0,S.jsx)(`td`,{className:`sx-sandbox-list__td`,children:e.author}),(0,S.jsx)(`td`,{className:`sx-sandbox-list__td`,children:(e.tags||[]).map(e=>(0,S.jsx)(`span`,{className:`sx-sandbox-list__tag`,children:e},e))}),(0,S.jsx)(`td`,{className:`sx-sandbox-list__td`,children:e.estimatedTime}),(0,S.jsx)(`td`,{className:`sx-sandbox-list__td`,children:i?(0,S.jsx)(`span`,{className:`sx-sandbox-list__badge sx-sandbox-list__badge--disabled`,children:`未实现`}):a===`Solved`?(0,S.jsx)(`span`,{className:`sx-sandbox-list__badge sx-sandbox-list__badge--solved`,children:`✓ 已完成`}):(0,S.jsxs)(`span`,{className:`sx-sandbox-list__badge sx-sandbox-list__badge--todo`,children:[J.Todo.icon,` `,Hl(a)]})}),(0,S.jsx)(`td`,{className:`sx-sandbox-list__td`,onClick:e=>e.stopPropagation(),children:!i&&a!==`Solved`&&(0,S.jsx)(`button`,{type:`button`,className:`sx-sandbox-list__filter`,onClick:()=>n?.(e.sandboxId),title:`标记为已完成`,children:`✓ 完成`})})]},e.id)}),p.length===0&&(0,S.jsx)(`tr`,{children:(0,S.jsx)(`td`,{className:`sx-sandbox-list__td`,colSpan:9,style:{textAlign:`center`,padding:`28px`,color:`var(--sx-text-soft)`},children:`没有匹配的靶场`})})]})]})})]})}var Wl=[/github\.com\/scaffold-x/,/github\.com\/immaotianyi\/devforge/,/openaidoc\.org/,/example\.com/,/TODO/,/TBD/];function X(e){return!e||Wl.some(t=>t.test(e))}var Gl=[`scaffold-x`,`placeholder`,`example.com`];function Kl(e){if(!e)return!0;let t=String(e).toLowerCase();return Gl.some(e=>t.includes(e))?!0:X(e)}function ql({cta:e,className:t}){let{showToast:n}=Fl(),r=e?.href||``,i=e?.label||`链接`;function a(e){if(Kl(r)){e.preventDefault(),n(`该链接为占位符,暂未配置真实地址`,`warn`);return}}return(0,S.jsx)(`a`,{href:r||`#`,className:t,target:`_blank`,rel:`noopener noreferrer`,onClick:a,children:i})}var Jl={sandbox:{label:`Sandboxes`,icon:`⬡`},doc:{label:`Documents`,icon:`📄`},nav:{label:`Navigation`,icon:`▸`}};function Yl(e=[],t=[],n=[]){let r=[];return e.forEach(e=>{e.sandboxId&&r.push({type:`sandbox`,id:e.sandboxId,label:e.title,meta:`${e.category} · ${e.difficulty}`})}),t.forEach(e=>{r.push({type:`doc`,id:e.id,label:e.title,meta:e.subtitle||``})}),n.forEach(e=>{r.push({type:`nav`,id:e.id,label:e.title,meta:e.desc||`L1 方向`,path:[e.id,``]}),(e.children||[]).forEach(t=>{r.push({type:`nav`,id:`${e.id}/${t.id}`,label:`${e.title} / ${t.title}`,meta:t.desc||`L2 子方向`,path:[e.id,t.id]})})}),r}function Xl({onClose:e,onSelect:t,sandboxes:n,docs:r,funnelData:i,inputRef:a}){let[o,s]=(0,b.useState)(``),[c,l]=(0,b.useState)(0),u=(0,b.useRef)(null),d=(0,b.useMemo)(()=>Yl(n,r,i),[n,r,i]),f=(0,b.useMemo)(()=>{let e=o.trim().toLowerCase();return e?d.filter(t=>`${t.label} ${t.meta||``} ${t.type}`.toLowerCase().includes(e)):d},[d,o]),p=(0,b.useMemo)(()=>{let e=new Map;return f.forEach(t=>{e.has(t.type)||e.set(t.type,[]),e.get(t.type).push(t)}),Array.from(e.entries()).map(([e,t])=>({type:e,label:Jl[e]?.label||e,icon:Jl[e]?.icon||`•`,items:t}))},[f]),m=f,h=m.length>0?Math.min(c,m.length-1):0;(0,b.useEffect)(()=>{let e=setTimeout(()=>a?.current?.focus(),60);return()=>clearTimeout(e)},[a]),(0,b.useEffect)(()=>{(u.current?.querySelector(`[data-idx="active"]`))?.scrollIntoView({block:`nearest`})},[h,p]);function g(n){if(n.key===`ArrowDown`)n.preventDefault(),l(e=>Math.min(e+1,m.length-1));else if(n.key===`ArrowUp`)n.preventDefault(),l(e=>Math.max(e-1,0));else if(n.key===`Enter`){n.preventDefault();let e=m[h];e&&t?.(e)}else n.key===`Escape`&&(n.preventDefault(),e?.())}let _=-1;return(0,S.jsx)(`div`,{className:w(`sx-cmd-overlay`),onClick:e,role:`dialog`,"aria-modal":`true`,"aria-label":`命令面板`,children:(0,S.jsxs)(`div`,{className:w(`sx-cmd-panel`),onClick:e=>e.stopPropagation(),children:[(0,S.jsx)(`input`,{ref:a,type:`text`,className:`sx-cmd-input`,placeholder:`搜索靶场、文档或导航…`,value:o,onChange:e=>{s(e.target.value),l(0)},onKeyDown:g,autoComplete:`off`,spellCheck:!1}),(0,S.jsxs)(`div`,{className:`sx-cmd-list`,ref:u,children:[p.length===0&&(0,S.jsx)(`div`,{className:`sx-cmd-empty`,children:`没有匹配的结果`}),p.map(e=>(0,S.jsxs)(`div`,{children:[(0,S.jsxs)(`div`,{className:`sx-cmd-group`,children:[e.icon,` `,e.label]}),e.items.map(n=>{_+=1;let r=_===h;return(0,S.jsxs)(`div`,{className:w(`sx-cmd-item`,r&&`is-selected`),"data-idx":r?`active`:void 0,onMouseEnter:()=>l(_),onClick:()=>t?.(n),children:[(0,S.jsx)(`span`,{className:`sx-cmd-item__icon`,"aria-hidden":`true`,children:e.icon}),(0,S.jsx)(`span`,{className:`sx-cmd-item__label`,children:n.label}),n.meta&&(0,S.jsx)(`span`,{className:`sx-cmd-item__meta`,children:n.meta})]},`${n.type}-${n.id}`)})]},e.type))]})]})})}function Zl({open:e,onClose:t,onSelect:n,sandboxes:r,docs:i,funnelData:a,inputRef:o}){return e?(0,S.jsx)(Xl,{onClose:t,onSelect:n,sandboxes:r,docs:i,funnelData:a,inputRef:o}):null}function Ql({sandboxes:e=[],progress:t={}}){let{total:n,solved:r}=(0,b.useMemo)(()=>({total:e.filter(e=>e.sandboxId).length,solved:e.filter(e=>e.sandboxId&&t[e.sandboxId]===`Solved`).length}),[e,t]),i=n>0?Math.round(r/n*100):0;return(0,S.jsxs)(`div`,{className:w(`sx-progress`),"aria-label":`靶场完成进度`,children:[(0,S.jsx)(`div`,{className:`sx-progress__bar`,children:(0,S.jsx)(`div`,{className:`sx-progress__fill`,style:{width:`${i}%`}})}),(0,S.jsxs)(`span`,{className:`sx-progress__label`,children:[(0,S.jsx)(`strong`,{children:r}),` / `,n,` 完成 · `,i,`%`]})]})}function $l({onClose:e,onSave:t}){let[n,r]=(0,b.useState)(``),[i,a]=(0,b.useState)(!1),o=(0,b.useRef)(null);(0,b.useEffect)(()=>{let e=setTimeout(()=>o.current?.focus(),60);return()=>clearTimeout(e)},[]),(0,b.useEffect)(()=>{function t(t){t.key===`Escape`&&e?.()}return window.addEventListener(`keydown`,t),()=>window.removeEventListener(`keydown`,t)},[e]);function s(){let e=n.trim();e&&(t?.(e),r(``))}return(0,S.jsx)(`div`,{className:w(`sx-modal-overlay`),onClick:e,role:`dialog`,"aria-modal":`true`,"aria-label":`GitHub Token 设置`,children:(0,S.jsxs)(`div`,{className:w(`sx-modal`),onClick:e=>e.stopPropagation(),children:[(0,S.jsx)(`h3`,{className:`sx-modal__title`,children:`GitHub Personal Access Token`}),(0,S.jsxs)(`p`,{className:`sx-modal__desc`,children:[`提交 PR 需要一个带 `,(0,S.jsx)(`code`,{children:`repo`}),` 权限的 Token。 前往`,` `,(0,S.jsx)(`a`,{href:`https://github.com/settings/tokens/new?scopes=repo&description=DevForge`,target:`_blank`,rel:`noopener noreferrer`,children:`GitHub Settings → Tokens`}),`, 勾选 `,(0,S.jsx)(`code`,{children:`repo`}),` 后生成,粘贴到下方。Token 仅保存在本地 localStorage,不会上传到任何服务器。`]}),(0,S.jsxs)(`div`,{style:{position:`relative`},children:[(0,S.jsx)(`input`,{ref:o,type:i?`text`:`password`,className:`sx-modal__input`,placeholder:`ghp_xxxxxxxxxxxxxxxxxxxx`,value:n,onChange:e=>r(e.target.value),onKeyDown:e=>{e.key===`Enter`&&s()},autoComplete:`off`,spellCheck:!1}),(0,S.jsx)(`button`,{type:`button`,onClick:()=>a(e=>!e),"aria-label":i?`隐藏 Token`:`显示 Token`,style:{position:`absolute`,right:10,top:`50%`,transform:`translateY(-50%)`,background:`transparent`,border:`none`,cursor:`pointer`,color:`var(--sx-text-soft)`,fontSize:13,padding:4},children:i?`🙈`:`👁`})]}),(0,S.jsxs)(`div`,{className:`sx-modal__actions`,children:[(0,S.jsx)(`button`,{type:`button`,className:`sx-modal__btn sx-modal__btn--cancel`,onClick:e,children:`取消`}),(0,S.jsx)(`button`,{type:`button`,className:`sx-modal__btn sx-modal__btn--confirm`,onClick:s,disabled:!n.trim(),style:{opacity:n.trim()?1:.6},children:`保存 Token`})]})]})})}function eu({open:e,onClose:t,onSave:n}){return e?(0,S.jsx)($l,{onClose:t,onSave:n}):null}var tu=`https://github.com/immaotianyi/devforge`,nu=`https://api.github.com`,ru=`immaotianyi`,iu=`devforge`,au=`main`,ou=[{id:`software`,title:`软件开发`,desc:`覆盖前端 / 服务端 / AI 工程化全链路`,status:`available`,children:[{id:`frontend`,title:`前端工程`,desc:`React 19 · Hooks · 性能优化 · 工程规范`,children:[{id:`state-management`,tag:`State`,title:`React 状态管理实战`,desc:`练习 useState / useReducer / useContext，修复直接 mutation 和 Context 性能问题。`,cta:{kind:`sandbox`,sandboxId:`state-management`,label:`打开靶场`}},{id:`form-validation`,tag:`Form`,title:`表单验证实战`,desc:`练习受控组件、表单验证逻辑和密码强度检测。`,cta:{kind:`sandbox`,sandboxId:`form-validation`,label:`打开靶场`}},{id:`use-effect`,tag:`Hooks`,title:`useEffect 深度解析`,desc:`理解 Effect 生命周期、依赖数组、清理函数，修复常见的竞态和内存泄漏。`,cta:{kind:`sandbox`,sandboxId:`use-effect`,label:`打开靶场`}},{id:`context-perf`,tag:`Performance`,title:`Context 性能优化`,desc:`诊断 Context 导致的全局重渲染，掌握拆分 Context 和 memo 优化技巧。`,cta:{kind:`sandbox`,sandboxId:`context-perf`,label:`打开靶场`}}]},{id:`data-processing`,title:`数据处理`,desc:`序列化 · 异步 · 防抖节流 · 数据转换`,children:[{id:`json-serialize`,tag:`Serialization`,title:`JSON 序列化策略实战`,desc:`JSON 序列化的边界情况、深拷贝陷阱、循环引用处理与崩溃防御。`,cta:{kind:`sandbox`,sandboxId:`json-serialization`,label:`打开靶场`}},{id:`async-data`,tag:`Async`,title:`异步数据处理实战`,desc:`练习 async/await、AbortController、竞态条件处理和内存泄漏防护。`,cta:{kind:`sandbox`,sandboxId:`async-data`,label:`打开靶场`}},{id:`debounce-throttle`,tag:`Optimization`,title:`防抖与节流实战`,desc:`从零实现 debounce / throttle，理解它们的区别和适用场景。`,cta:{kind:`sandbox`,sandboxId:`debounce-throttle`,label:`打开靶场`}}]},{id:`performance`,title:`性能优化`,desc:`memo · 虚拟列表 · 渲染优化`,children:[{id:`memo-demo`,tag:`Memo`,title:`React.memo 优化实战`,desc:`诊断不必要的重渲染，使用 memo / useMemo / useCallback 优化组件树。`,cta:{kind:`sandbox`,sandboxId:`memo-optimization`,label:`打开靶场`}},{id:`virtual-list`,tag:`Virtualization`,title:`虚拟列表实现`,desc:`从零实现虚拟滚动列表，理解窗口化渲染原理和 DOM 回收策略。`,cta:{kind:`sandbox`,sandboxId:`virtual-list`,label:`打开靶场`}}]},{id:`ai-eng`,title:`AI 工程化`,desc:`端侧 AI · Multi-Agent · API 封装`,children:[{id:`ai-architecture`,tag:`AI`,title:`AI 工程化规范`,desc:`端侧离线 AI 助手 · 多 Agent 架构落地的工程规范与最佳实践。`,cta:{kind:`doc`,docId:`ai-engineering`,label:`查看规范`}},{id:`on-device-ai`,tag:`On-Device`,title:`端侧离线 AI 助手`,desc:`在桌面 / 移动端运行本地大模型，构建不依赖云端的离线 AI 沙盒。`,cta:{kind:`external`,href:(e=>`${tu}/blob/main/${e}`)(`src/sandboxes/`),label:`查看源码`}}]},{id:`server`,title:`服务端基建`,desc:`Ktor / Spring Cloud 工业级后端脚手架`,children:[{id:`architecture-doc`,tag:`Architecture`,title:`架构设计文档`,desc:`为什么是单体仓库？为什么是纯 Markdown？三类资产如何共存？`,cta:{kind:`doc`,docId:`architecture`,label:`阅读文档`}},{id:`rules-doc`,tag:`Rules`,title:`代码规范法典`,desc:`ESLint 规则逐条解释 + 正确/错误对照，CI 拦截的每一条规则都在这里。`,cta:{kind:`doc`,docId:`rules`,label:`阅读规范`}}]}]},{id:`security`,title:`网络安全`,desc:`渗透测试 / 红蓝对抗靶场 (筹备中)`,status:`wip`,children:[]}],su='# JSON 序列化策略实战\n\n## 概念\n\n`JSON.stringify` 是前端最常用的序列化手段,但它并非"无所不能"。它对 `undefined`、函数、`Symbol` 会**静默丢弃**,对 `BigInt` 和**循环引用**会直接**抛出 TypeError**,对 `Date` 对象会降级为 ISO 字符串(丢失类型信息)。理解这些边界行为,才能写出健壮的持久化与接口传输代码。\n\n## 任务目标\n\n修复本靶场中的序列化隐患:\n\n1. 实现一个 `safeStringify` 函数,能正确处理循环引用、`BigInt`、函数、`undefined`、`Date` 对象,不抛异常且保留可读信息。\n2. 实现 `analyze` 陷阱检测器,递归遍历对象,提前报告所有可能导致 `JSON.stringify` 失败或数据丢失的字段及其路径。\n3. 完善对象树渲染,让 `BigInt`、`Date`、函数等特殊类型在树上以醒目样式展示。\n\n## 常见陷阱\n\n- **静默丢数据**:对象中的 `undefined` / 函数 / `Symbol` 值在 `JSON.stringify` 后会"消失",且没有任何报错,极易引发线上 bug。\n- **BigInt 抛错**:任意一个 `bigint` 字段都会让整个 `JSON.stringify` 抛 `TypeError: Do not know how to serialize a BigInt`。\n- **循环引用抛错**:对象互相引用时,`JSON.stringify` 抛 `Converting circular structure to JSON`。\n- **Date 丢失类型**:`new Date()` 会被序列化成字符串,反序列化后变成字符串而非 Date 对象,需要手动 `reviver` 还原。\n- **NaN / Infinity**:会被转成 `null`,同样静默。\n- **深拷贝误解**:很多人用 `JSON.parse(JSON.stringify(x))` 做深拷贝,但上述类型全部会丢失或崩溃。请用 `structuredClone` 或lodash `cloneDeep`。\n\n## 提示\n\n- 利用 `JSON.stringify` 的第二个参数 **replacer 函数**:它在每个键值对上被调用,是拦截特殊类型的最佳位置。\n- 用 `WeakSet` 记录已访问对象,遇到重复引用即判定为循环引用并返回占位字符串。\n- 注意 replacer 接收到的 `value` 已被预处理:顶层的 `this` 是 `{ "": obj }` 包裹对象。\n- 陷阱检测要递归并传递**路径字符串**(如 `$.user.addr`),方便定位问题字段。\n- 点击页面上的"危险对象"按钮可加载无法用 JSON 文本表达的真实对象,直观感受原生序列化与安全序列化的差异。\n',cu='# 异步数据处理实战\n\n## 概念\n\n在 React 中发起异步请求(搜索、分页、Tab 切换)时,如果用户快速连续触发多个请求,后发的请求**可能先返回**,先发的请求**可能后返回**。若直接用 `setState` 接收响应,后返回的旧结果会覆盖新结果,这就是经典的**竞态条件 (Race Condition)**。此外,组件卸载后仍在进行的请求若回调里 `setState`,会触发"Can\'t perform a React state update on an unmounted component"警告甚至内存泄漏。\n\n## 任务目标\n\n1. **复现 Bug**:在"竞态 (有 Bug)"模式下,点击"请求 A"后立刻点"请求 B"。预期看到 B 先返回并展示,随后 A 返回却把 B 覆盖掉——最终页面停留在过期的 A 结果上。\n2. **RequestId 修复**:为每个请求分配递增 ID,只让"最新请求"的响应被应用,其余一律忽略。\n3. **AbortController 修复**:发起新请求前 `abort()` 上一个,从源头取消在途请求。并实现手动"取消在途请求"按钮。\n4. 完善时间线可视化,让"已忽略"与"已取消"的请求一目了然。\n\n## 常见陷阱\n\n- **直接 setState**:只判断"请求成功"就 setState,不判断该响应是否仍然有效。\n- **闭包陷阱**:用 `useCallback` 时若忘记把依赖放进数组,回调会捕获过期的 state;但若把会变的值放进依赖又会导致回调频繁重建。这里更适合用 **ref** 保存"最新请求 ID",回调保持稳定。\n- **未清理定时器/订阅**:`setTimeout`、`setInterval`、`addEventListener`、`fetch` 在组件卸载后仍会执行回调。\n- **AbortError 误报**:`abort()` 后 Promise 会 reject,需要在 `catch` 里区分 `AbortError`,不要把它当真实错误抛给用户。\n- **竞态不仅在 fetch**:任何"先发后到"的异步(防抖搜索、路由切换、分页)都有此问题。\n\n## 提示\n\n- 用一个 `idRef`(递增计数)标记每次请求,再配一个 `latestRef` 记录最新 ID;响应到达时比较两者,相等才 `setState`。\n- `AbortController` 既是竞态修复手段,也是取消请求的标准 API,且能真正中断网络请求、节省带宽。\n- 时间线用"存活区间"表示请求:从 `firedAt` 到 `resolvedAt`,正在进行的请求用条纹动画延伸到"当前时刻"。\n- 组件卸载防护:在 `useEffect` 清理函数里 `abort()` 并标记 `didCancel`,回调里据此跳过 `setState`。\n- 本靶场用 `setTimeout` 模拟网络延迟,真实项目中替换为 `fetch(url, { signal })` 即可。\n',lu='# 防抖与节流实战\n\n## 概念\n\n两者都用来**控制高频事件的执行频率**,但策略不同:\n\n- **防抖 (Debounce)**:事件持续触发时一直不执行,直到**停止触发一段时间**后才执行一次。适合"搜索框输入联想""窗口 resize 计算布局"——只关心最后一次。\n- **节流 (Throttle)**:在持续触发期间,**每隔固定间隔**最多执行一次。适合"滚动监听""拖拽位置上报""按钮防连点"——需要匀速采样。\n\n## 任务目标\n\n1. 从零实现 `debounce` 与 `throttle`(本靶场已用 `setTimeout`/时间戳实现,请理解并改写为通用工具函数)。\n2. 通过拖动滑块或"连发测试"按钮,观察三者计数差异:原始事件数 ≫ 节流执行数;防抖执行数 = 1(在停顿后)。\n3. 实现带**前沿 (leading)** 与**后沿 (trailing)** 选项的节流,理解本靶场当前只实现了前沿节流的局限。\n4. 调节延迟/间隔滑块,体会延迟越大、降频越明显。\n\n## 常见陷阱\n\n- **混淆二者场景**:搜索联想用节流会导致中途频繁请求;滚动用防抖会导致滚动时一直不更新,停止才跳变。\n- **闭包导致 `this`/参数丢失**:用普通 `function` 返回时,若直接 `fn(...args)` 调用没问题;但若需要保留 `this`,要用 `apply(this, args)`。箭头函数无 `this`。\n- **取消防抖**:防抖的 `setTimeout` 若不在组件卸载或依赖变化时 `clearTimeout`,会执行已废弃的回调。建议把 timer 存 ref,`useEffect` 清理。\n- **节流时间戳未初始化**:`last` 初值为 `0`,首次调用 `now - 0` 必然 ≥ interval,所以首次必触发——这是期望行为,但要知道原因。\n- **后沿丢失**:纯前沿节流会丢弃最后一次事件,滚动到边界时可能停在不更新的值上。lodash 默认 `leading: true, trailing: true`。\n\n## 提示\n\n- 防抖核心:`clearTimeout(timer); timer = setTimeout(fn, delay)`——每次进来都重置。\n- 节流核心:记录 `lastTime`,进来时 `if (now - lastTime >= interval) { lastTime = now; fn() }`。\n- 后沿节流:在不满足间隔时,再排一个 `setTimeout` 在间隔末尾补一次,并记住"最后一个值"。\n- 可视化里:防抖进度条在等待期间从满到空(快到点了),节流冷却条从空到满(冷却中)。\n- 性能:对极高频事件(鼠标移动 60fps+),防抖/节流能大幅减少 React 重渲染次数。\n',uu='# React 状态管理实战\n\n## 概念\n\nReact 状态更新遵循**不可变 (immutable)** 原则:必须返回一个全新的引用,React 才能感知变化并触发重渲染。三种主流状态模式各有取舍:\n\n- **useState**:适合简单独立状态,但极易写出 `arr.push(x); setArr(arr)` 这种**直接 mutation** 的 bug。\n- **useReducer**:把状态变迁逻辑集中成纯函数 `reducer(state, action)`,便于测试与追溯,适合复杂状态机。\n- **useContext**:跨层共享状态,但**单一 Context 携带过多状态**时,任意一块变化都会让所有消费者重渲染,即使它只关心另一块。\n\n## 任务目标\n\n1. **useState 卡片(Bug 模式)**:点击"添加",发现列表不更新、渲染计数不增长。定位原因:直接 `push` 后 `setItems(items)` 传入同一引用,React 浅比较判定未变化而跳过更新。\n2. **useReducer 卡片**:理解 reducer/action 不可变写法,补全"删除""清空已完成"等 action。\n3. **Context 卡片(Bug 模式)**:点击 `count + 1`,观察"标签消费者"也被迫重渲染(橙色高亮)。切到"修复模式",改用拆分 Context,确认标签消费者不再随 count 重渲染。\n4. 用渲染计数 (`useRenderCount`) 量化每个组件的重渲染次数,验证优化效果。\n\n## 常见陷阱\n\n- **直接 mutation**:`state.push()`、`state.x = 1`、`Object.assign(state, ...)` 都会原地修改,React 检测不到。\n- **浅比较 bailout**:`setState(同一引用)` 会被 React 跳过(bailout),连 render 都不执行,这是 mutation 最隐蔽的危害。\n- **Context 粒度过大**:把"高频变化值"和"低频稳定值"塞进同一个 Context value 对象,该对象每次重建都会触发全部消费者重渲染。\n- **value 对象未 memo**:`<Ctx.Provider value={{ a, b }}>` 每次渲染都新建对象 → 即使 a/b 没变,消费者也重渲染。需要 `useMemo` 包裹 value。\n- **reducer 中 mutation**:`state.todos.push(...)` 在 reducer 里同样错误,必须 `return { ...state, todos: [...] }`。\n\n## 提示\n\n- 不可变更新:数组用 `[...arr, x]` / `arr.filter()` / `arr.map()`;对象用 `{ ...obj, key: val }`。深层嵌套可用 Immer 的 `produce`。\n- 渲染计数小技巧:`const r = useRef(0); r.current += 1`(教学用,生产环境勿依赖渲染副作用)。\n- 拆分 Context:把频繁变化的 `count` 放进 `CounterCtx`,稳定的 `label` 放进 `LabelCtx`,各自 Provider,各自消费者只订阅关心的部分。\n- 进一步优化:对 Context value 用 `useMemo`,对消费者用 `React.memo`,避免父组件重渲染时连带消费者。\n- 本靶场切换"Bug / 修复"会让 Context 子树重新挂载,渲染计数会重置,属正常现象。\n',du='# 表单验证实战\n\n## 概念\n\n受控表单验证的核心是:**输入即校验**。每个字段在用户输入时实时计算状态(有效/无效),并把结果反馈给 UI(边框、提示、强度条)。提交按钮在全部字段有效前保持禁用。难点不在 UI,而在**校验规则本身的正确性**——尤其是正则表达式。\n\n## 任务目标\n\n1. 补全四个字段的校验:用户名(3-20 位字母数字)、邮箱、密码(8+ 且含大写、数字、特殊符)、确认密码(须一致)。\n2. 实现密码强度条:弱 / 中 / 强 三档,依据长度与字符种类综合判定。\n3. **修复邮箱正则 Bug**:当前"宽松正则" `/^\\S+@\\S+$/` 会把 `a@b`、`user@example`、`user@.com` 判为有效。切换到"严格正则"后这些应被拒绝,且提交按钮不应被无效邮箱提前解锁。\n4. 完善确认密码的"失焦再校验"体验:避免用户输入密码途中确认密码一直报红。\n\n## 常见陷阱\n\n- **正则过宽**:`/@/` 只要含 `@` 就通过;`/^\\S+@\\S+$/` 允许 `a@b`、`a@@b`、`@b` 之外几乎全部。真正邮箱至少要有 `本地名@域名.TLD`,且 TLD ≥ 2 字符。\n- **正则过严**:RFC 5322 允许 `+`、`.`、 quoted-string 等,过严的正则会误杀合法邮箱(如 `user+tag@gmail.com`)。生产中推荐"宽进严出 + 发验证邮件"。\n- **只校验非空就放行**:`if (value)` 一刀切,跳过格式/长度校验。\n- **强度算法过简**:只看长度不看字符多样性,会把 `aaaaaaaa` 判为强密码。\n- **确认密码过早报错**:用户还没输完确认框就标红,体验差。应在 blur 或确认框非空时才比对。\n- **XSS 与信任**:前端校验仅为体验,后端必须再校验一次,绝不能信任前端数据。\n\n## 提示\n\n- 邮箱正则参考:`/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/`,要求"无空白、单个 @、域名含点、TLD 至少 2 位"。\n- 用点击"邮箱用例"快速复现 Bug:在宽松模式下 `a@b` 显示绿色且提交可用;切严格模式后变红。\n- 密码强度:可按"长度 + 大小写 + 数字 + 特殊符 + 长度≥12"逐项加分,再映射到弱/中/强。\n- 受控组件:用对象 state 集中管理字段值 `{username, email, password, confirm}`,用 `touched` 标记是否交互过,避免初始即报错。\n- 校验逻辑抽成纯函数 `validateX(value)`,便于单元测试与复用。\n',fu='# useEffect 深度解析\n\n## 概念\n\n`useEffect` 让函数组件获得"副作用"能力。它的本质是:**在渲染提交到屏幕之后,执行你注册的函数;并在下一次执行同一函数之前(或卸载时)运行上一次返回的清理函数**。依赖数组 `deps` 决定"何时重新执行":\n- 不传 → 每次渲染后都执行\n- `[]` → 仅挂载/卸载时执行\n- `[a, b]` → a 或 b 变化时执行(挂载时也会执行一次)\n\n典型生命周期:**挂载 → 运行 effect → 依赖变化 → 清理上次 → 运行新 effect → 卸载 → 清理最后一次**。\n\n## 任务目标\n\n1. 理解三个 Effect 的行为:Effect#1 仅挂载时"fetch",Effect#2 定时器依赖 `running`(切换可看到 run→cleanup→re-run),Effect#3 计算依赖 `count`。\n2. **复现缺失依赖 Bug**:在"依赖: 缺失"模式下,切换 `multiplier` 后,Effect#3 不会重新运行,"Effect 内捕获"停留在旧值,与"实时计算"不一致——这就是**闭包过期 (stale closure)**。\n3. 切换"依赖: 完整",把 `multiplier` 加入 deps,确认捕获值与实时值始终一致。\n4. 切换"已挂载/已卸载",观察卸载时所有清理函数的执行顺序。\n5. 理解定时器 Effect 必须在清理函数里 `clearInterval`,否则会内存泄漏/重复计时。\n\n## 常见陷阱\n\n- **缺失依赖**:effect 内使用了某个变量却没写进 deps,该变量更新时 effect 不重跑,闭包捕获的是旧值。这是 `exhaustive-deps` ESLint 规则要拦截的头号问题。\n- **依赖数组里塞函数/对象**:每次渲染新建的函数/对象引用都不同,会导致 effect 每次都跑。需用 `useCallback`/`useMemo` 稳定引用。\n- **清理函数遗漏**:`setInterval`、`addEventListener`、`Subscription`、`fetch` 不清理 → 卸载后仍执行回调,触发"对已卸载组件 setState"或内存泄漏。\n- **把 effect 当事件**:`useEffect` 是"同步外部系统",不是响应用户事件的地方;点击处理应放事件回调,而非 effect。\n- **无限循环**:`setX(x+1)` 写在 deps 含 x 的 effect 里,或漏 deps 导致每次都跑 → 死循环。\n- **竞态**:effect 里发起异步请求但未用"忽略过期响应/AbortController"(见异步靶场)。\n\n## 提示\n\n- 依赖数组的判断标准:**effect 里用到的所有外部变量都要进 deps**(除非你刻意要旧值,并加注释说明)。\n- 修复闭包过期:把 `multiplier` 加入 Effect#3 的 deps,或用 `useRef` 保存最新值并在 effect 内读取 `ref.current`。\n- 清理函数是"防御性编程"的核心:`return () => clearInterval(iv)` 保证无论依赖变化还是卸载,资源都被回收。\n- 时间线里的"清理"出现在每次"运行"之前(除首次),以及卸载时——这是 React 的固定顺序。\n- 用 ESLint 的 `react-hooks/exhaustive-deps` 规则提前发现缺失依赖,生产项目务必开启。\n',pu=`# Context 性能优化

## 概念

\`useContext\` 的更新机制是"广播":**只要 Provider 的 value 变了,所有消费该 Context 的组件都会重渲染**,哪怕它只用到了 value 里没变的那一部分。当 Context 承载多个状态、且其中某个状态变化频繁时,就会引发大面积无意义的重渲染。

**拆分 Context (Split Context)**:把"频繁变化"与"低频稳定"的状态拆到不同的 Context,各自 Provider、各自消费者,从源头缩小重渲染范围。再配合 \`React.memo\`,可让"不关心变化值的消费者"完全跳过渲染。

## 任务目标

1. 观察"单一 Context"面板:改 color(频繁)时,只读 label 的"信息组件"渲染计数也飙升——这就是过度重渲染。
2. 观察"拆分 Context"面板:同样改 color,只有"色块组件"计数增长,"信息组件"保持不变。
3. 点击"连发改色 ×14",对比两面板渲染计数差距——单一侧信息组件 ≈ 14,拆分侧 ≈ 0。
4. 改 label(低频),理解拆分后两方向都受益:只让读 label 的组件重渲染。
5. (进阶)给 Provider 的 value 套 \`useMemo\`,避免"同值新对象"导致的重渲染。

## 常见陷阱

- **value 每次新建对象**:\`<Ctx.Provider value={{ a, b }}>\` 每次渲染都生成新对象 → 即使 a/b 没变,消费者也重渲染。需 \`useMemo(() => ({ a, b }), [a, b])\`。
- **单一 Context 塞太多**:把用户信息、主题、通知、计数全放一个 Context,任一变化全员重渲染。
- **memo 不配 Context 等于没配**:\`React.memo\` 只挡 props 变化,挡不住 Context 变化;但**没有 memo 时,父组件重渲染会连带给 Context 消费者**。要"父重渲染、消费者不渲染",必须 memo + 拆分 Context 双管齐下。
- **消费者层级过深**:Provider 放在很高层,中间大量组件虽不消费 Context,但若没 memo,父级重渲染仍会连带它们。
- **用 Context 传函数**:函数若未 \`useCallback\` 稳定,每次都是新引用,触发消费者重渲染。

## 提示

- 拆分原则:**按变化频率分**。频繁变化的(如主题色、当前选中项)单独一个 Context;几乎不变的(如用户身份、配置)另一个。
- 本靶场的"色块组件"用 \`React.memo\` 包裹且无 props,因此只有当它消费的 Context 变化时才重渲染;父组件重渲染被 memo 挡住。
- "信息组件"同理:单一 Context 模式下 value 变了它必渲染;拆分模式下它的 Context 没变 → memo 生效 → 不渲染。
- 进一步:用 \`use-context-selector\`(库)实现"选择性订阅",只在自己用的字段变化时重渲染。
- 父组件渲染计数也会增长(它持有 state),但这不影响被 memo+拆分保护的消费者——这正是优化的价值。
`,mu='# React.memo 与 Hook 记忆化\n\n## 概念\n\n`React.memo(Component)` 对组件做**浅比较**:若本次 props 与上次逐个 `Object.is` 相等,就跳过重渲染。但浅比较非常"脆弱"——只要任一 prop 是新引用(新函数、新对象、新数组),memo 就失效。因此 memo 通常要和 `useCallback`(稳定函数)、`useMemo`(稳定值)配合使用,三者缺一不可。\n\n- **React.memo**:挡住"父组件重渲染但 props 没变"导致的子组件重渲染。\n- **useCallback**:让传给子组件的回调函数引用稳定。\n- **useMemo**:让派生的对象/数组引用稳定,避免每次渲染新建。\n\n## 任务目标\n\n1. **复现 Bug**:在"无 memo (Bug)"模式点击"无关计数器 +1",观察 6 个子项的渲染计数全部增长——计数器与子项毫无关系,却全员重渲染。\n2. **修复**:切到"memo + useCallback",再次点击计数器,子项渲染计数不再增长;只有点击切换选中项时,新旧两个选中项才重渲染。\n3. 用"连按 6 次"放大差异,直观感受 memo 带来的渲染削减。\n4. 观察"useMemo 重算"计数:它只在 `selectedId` 变化时增长,点击计数器不增长——这就是 `useMemo` 的价值。\n\n## 常见陷阱\n\n- **内联回调破坏 memo**:`<Child onSelect={() => doX(id)} />` 每次渲染都新建函数 → memo 永远失效。必须 `useCallback`。\n- **内联对象/数组破坏 memo**:`<Child config={{ a: 1 }} />` / `<Child list={items.filter(...)} />` 同理。用 `useMemo` 或在 props 外部计算并记忆。\n- **memo 了但 props 有新引用**:只 memo 组件却忘了稳定 props,等于白 memo。三件套要一起上。\n- **过度 memo**:对极轻的组件或本来就每次都要变的 props 做 memo,记忆化本身有开销,可能得不偿失。先测量再优化。\n- **useMemo/useCallback 依赖写错**:漏依赖会得到过期闭包(见 useEffect 靶场);多写无谓依赖会频繁失效。\n- **children 也会触发**:`<Child>{children}</Child>` 中 children 是新元素时 memo 失效。\n\n## 提示\n\n- 判断"该不该 memo":子组件渲染成本高、或子组件数量多(长列表)、或父组件频繁重渲染但子 props 偶尔变。\n- `useCallback((id) => setSelectedId(id), [])`:`setSelectedId` 来自 useState 是稳定引用,所以依赖为空是安全的。\n- `useMemo` 的依赖要包含所有用于计算的变量;`stats` 依赖 `[selectedId]`,所以 count 变化时不重算。\n- 真正的长列表优化首选**虚拟滚动**(见虚拟列表靶场),memo 只是辅助。\n- 用 React DevTools Profiler 录制一次"连按 6 次",直观看到 Bug 模式下 6 个 Child 全亮、修复模式下不亮。\n',hu='# 虚拟列表实现\n\n## 概念\n\n当列表条目成千上万时,把所有 DOM 节点一次性渲染会拖垮首屏与滚动性能。**虚拟滚动 (Virtual Scrolling)** 的思路是:无论数据有多少条,只渲染"当前可视区域内 + 少量缓冲"的少量节点,其余通过占位高度维持原生滚动条的位置感。这样 DOM 节点数恒定(几十个),与数据总量解耦。\n\n核心公式:\n- `start = floor(scrollTop / itemHeight) - buffer`\n- `visibleCount = ceil(viewportHeight / itemHeight) + buffer * 2`\n- `end = min(total, start + visibleCount)`\n- 每个可视项用 `position: absolute; top: (index * itemHeight)` 定位;外层容器高度 = `total * itemHeight`。\n\n## 任务目标\n\n1. 在"虚拟滚动"模式下滚动列表,观察"渲染节点"始终维持在 ~{ceil(VIEW_H/ITEM_H)+8} 条,而滚动条丝滑;点击"快速跳转 0/25/50/75/100%"验证定位准确。\n2. 切到"全量渲染",亲身感受首屏卡顿与滚动掉帧;对比两模式的"渲染节点"数(几十 vs 一万)。\n3. 理解 `jumpTo` 如何通过设置 `scrollTop` 跳转,以及 `onScroll` 如何驱动 `start/end` 重算。\n4. (进阶)为每项加入**动态高度**支持(需测量真实高度并维护累积偏移表)。\n5. (进阶)用 `ResizeObserver` 监听容器尺寸变化,自适应 `visibleCount`。\n\n## 常见陷阱\n\n- **忘记撑开总高度**:若外层容器没有 `height: total * itemHeight`,滚动条范围就错了,无法滚到底部。\n- **直接 translateY 整个列表**:常见做法是用一个绝对定位的项容器,而不是逐项 `top`;若用 `transform` 要注意其层叠上下文与硬件加速。\n- **滚动抖动/闪烁**:缓冲(buffer)不足会导致滚动时出现空白间隙,buffer 取 3~5 较稳。\n- **key 用 index**:虚拟列表里 index 会随滚动变化,必须用稳定的 `item.id` 作 key,否则复用错乱。\n- **scrollTop 抖动**:某些浏览器滚动事件高频触发,直接 setState 一般够用;若卡顿可用 `requestAnimationFrame` 节流。\n- **不回收 DOM**:虚拟列表的价值在于"窗口外节点被卸载";若用了 `content-visibility: auto` 但没控制数量,仍可能过多。\n\n## 提示\n\n- 本靶场固定行高 `ITEM_H = 34`,公式简单;动态行高场景需"预估高度 + 滚动后实测修正"。\n- `useMemo` 对 `slice` 记忆,避免每次都切数组;`start/end` 是其依赖。\n- 跳转:先设 `el.scrollTop = target`(原生滚动),再 `setScrollTop(target)` 同步可视区间。\n- 生产中优先用成熟库:`react-window`(轻量)、`@tanstack/react-virtual`(灵活,支持动态高度)、`react-virtuoso`(功能全)。\n- 全量渲染 10000 节点在现代浏览器也勉强能跑,但在低端机/移动端会明显卡顿;虚拟化是长列表的标配。\n',gu=`import { useMemo, useState } from 'react'

/* ===== 安全序列化 (修复版): 处理循环引用 / BigInt / 函数 / undefined / Date ===== */
function safeStringify(obj, space = 2) {
  const seen = new WeakSet()
  return JSON.stringify(obj, (_k, val) => {
    if (typeof val === 'bigint') return \`[BigInt] \${val}n\`
    if (typeof val === 'function') return '[Function]'
    if (val === undefined) return '[Undefined]'
    if (val instanceof Date) return \`[Date] \${val.toISOString()}\`
    if (val && typeof val === 'object') {
      if (seen.has(val)) return '[Circular]'
      seen.add(val)
    }
    return val
  }, space)
}

/* ===== 陷阱检测: 遍历对象, 收集所有潜在序列化问题 ===== */
function analyze(obj, path = '$', seen = new WeakSet(), out = []) {
  if (obj === null || typeof obj !== 'object') return out
  if (seen.has(obj)) { out.push({ path, tag: '循环引用', desc: 'JSON.stringify 抛 TypeError' }); return out }
  seen.add(obj)
  for (const [k, v] of Object.entries(obj)) {
    const p = \`\${path}.\${k}\`
    if (v === undefined) out.push({ path: p, tag: 'undefined', desc: '字段被静默丢弃' })
    else if (typeof v === 'function') out.push({ path: p, tag: '函数', desc: '字段被静默丢弃' })
    else if (typeof v === 'bigint') out.push({ path: p, tag: 'BigInt', desc: '抛出 TypeError' })
    else if (v instanceof Date) out.push({ path: p, tag: 'Date', desc: '降级为 ISO 字符串' })
    else if (typeof v === 'object') analyze(v, p, seen, out)
  }
  return out
}

const TEXT_EXAMPLES = [
  { label: '常规对象', text: '{\\n  "name": "Alice",\\n  "age": 30,\\n  "skills": ["JS", "React"],\\n  "active": true\\n}' },
  { label: '嵌套结构', text: '{\\n  "user": {\\n    "name": "Bob",\\n    "addr": { "city": "上海", "zip": "200000" }\\n  },\\n  "tags": ["a", "b"]\\n}' },
  { label: '数组集合', text: '[\\n  { "id": 1, "name": "甲" },\\n  { "id": 2, "name": "乙" }\\n]' },
]

function makeLive(type) {
  switch (type) {
    case 'undefined': return { name: 'Alice', age: undefined, greet() {}, city: '北京' }
    case 'date': return { user: 'Bob', createdAt: new Date('2024-01-01T00:00:00Z'), updatedAt: new Date() }
    case 'bigint': return { id: 9007199254740993n, count: 42n, name: 'C' }
    case 'circular': { const o = { name: 'Loop', list: [] }; o.self = o; o.list.push(o); return o }
    default: return { hello: 'world' }
  }
}

const LIVE_EXAMPLES = [
  { label: '含 undefined/函数', type: 'undefined' },
  { label: '含 Date', type: 'date' },
  { label: '含 BigInt', type: 'bigint' },
  { label: '循环引用', type: 'circular' },
]

/* 递归对象树渲染 */
function Tree({ value }) {
  if (value === null) return <em className="jsb-null">null</em>
  if (value instanceof Date) return <span className="jsb-date">Date({value.toISOString()})</span>
  if (typeof value !== 'object') {
    if (typeof value === 'string') return <span className="jsb-str">"{value}"</span>
    if (typeof value === 'number') return <span className="jsb-num">{value}</span>
    if (typeof value === 'boolean') return <span className="jsb-bool">{String(value)}</span>
    if (typeof value === 'bigint') return <span className="jsb-bigint">{value.toString()}n</span>
    if (typeof value === 'function') return <span className="jsb-fn">ƒ ()</span>
    if (value === undefined) return <span className="jsb-undef">undefined</span>
    return <span>{String(value)}</span>
  }
  const isArr = Array.isArray(value)
  const entries = Object.entries(value)
  return (
    <span className="jsb-node">
      <span className="jsb-brk">{isArr ? '[' : '{'}</span>
      {entries.length === 0 ? <span className="jsb-brk">{isArr ? ']' : '}'}</span> : (
        <ul className="jsb-children">
          {entries.map(([k, v], i) => (
            <li key={k + i}>
              <span className="jsb-key">{isArr ? i : k}</span>
              <span className="jsb-colon">: </span>
              <Tree value={v} />
            </li>
          ))}
          <span className="jsb-brk">{isArr ? ']' : '}'}</span>
        </ul>
      )}
    </span>
  )
}

export default function JSONSerializationSandbox() {
  const [text, setText] = useState(TEXT_EXAMPLES[0].text)
  const [liveType, setLiveType] = useState(null)
  const live = useMemo(() => (liveType ? makeLive(liveType) : null), [liveType])
  const { obj, parseError } = useMemo(() => {
    if (live) return { obj: live, parseError: null }
    try { return { obj: JSON.parse(text), parseError: null } } catch (e) { return { obj: null, parseError: e.message } }
  }, [text, live])
  const issues = useMemo(() => (obj ? analyze(obj) : []), [obj])
  const native = useMemo(() => {
    if (obj == null) return { ok: true, text: String(obj) }
    try { return { ok: true, text: JSON.stringify(obj, null, 2) } } catch (e) { return { ok: false, text: e.message } }
  }, [obj])
  const safe = useMemo(() => { try { return safeStringify(obj, 2) } catch { return '失败' } }, [obj])

  function loadText(t) { setLiveType(null); setText(t) }
  function loadLive(type) {
    setLiveType(type)
    setText(\`// ⚠ 实时对象示例 (\${type})\\n// 该对象无法用 JSON 文本表达, 下方展示其序列化行为\`)
  }

  return (
    <div className="jsb-root">
      <style>{\`
.jsb-root{font-family:var(--sx-sans);color:var(--sx-text);}
.jsb-head h3{font-size:18px;margin:0 0 4px;color:var(--sx-text-h);}
.jsb-head p{font-size:13px;color:var(--sx-text-soft);margin:0 0 16px;}
.jsb-head code{font-size:12px;}
.jsb-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:16px;}
@media(max-width:860px){.jsb-grid{grid-template-columns:1fr;}}
.jsb-col{display:flex;flex-direction:column;gap:12px;}
.jsb-label{font-size:12px;color:var(--sx-text-soft);font-family:var(--sx-mono);text-transform:uppercase;letter-spacing:.05em;}
.jsb-input{width:100%;min-height:180px;resize:vertical;background:var(--sx-bg-soft);border:1px solid var(--sx-border);border-radius:var(--sx-radius);color:var(--sx-text-h);padding:12px;font-family:var(--sx-mono);font-size:13px;line-height:1.6;outline:none;}
.jsb-input:focus{border-color:var(--sx-accent);}
.jsb-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center;}
.jsb-chips-title{font-size:11px;color:var(--sx-text-soft);font-family:var(--sx-mono);margin-right:4px;}
.jsb-chip{padding:5px 10px;font-size:12px;background:var(--sx-bg-elev);border:1px solid var(--sx-border);border-radius:6px;color:var(--sx-text);cursor:pointer;transition:all .15s;}
.jsb-chip:hover{border-color:var(--sx-accent-border);color:var(--sx-accent-strong);}
.jsb-chip.is-on{background:var(--sx-accent-bg);border-color:var(--sx-accent);color:var(--sx-accent-strong);}
.jsb-chip--warn:hover{border-color:rgba(245,158,11,.5);color:var(--sx-warn);}
.jsb-chip--warn.is-on{background:var(--sx-warn-bg);border-color:var(--sx-warn);color:var(--sx-warn);}
.jsb-card{background:var(--sx-bg-soft);border:1px solid var(--sx-border);border-radius:var(--sx-radius);padding:12px 14px;}
.jsb-card-head{font-size:13px;font-weight:600;color:var(--sx-text-h);margin-bottom:8px;display:flex;align-items:center;gap:8px;}
.jsb-hint{font-size:11px;color:var(--sx-text-soft);font-weight:400;font-family:var(--sx-mono);}
.jsb-tag{font-size:10px;font-family:var(--sx-mono);padding:1px 6px;border-radius:4px;}
.jsb-tag--warn{color:var(--sx-warn);background:var(--sx-warn-bg);}
.jsb-tag--red{color:var(--sx-red);background:var(--sx-red-bg);}
.jsb-tree-box{font-family:var(--sx-mono);font-size:13px;line-height:1.7;overflow:auto;max-height:220px;}
.jsb-children{list-style:none;padding-left:18px;margin:0;border-left:1px dashed var(--sx-border);}
.jsb-key{color:var(--sx-cyan);}
.jsb-colon{color:var(--sx-text-soft);}
.jsb-brk{color:var(--sx-text-soft);}
.jsb-str{color:var(--sx-green);}
.jsb-num{color:var(--sx-accent-strong);}
.jsb-bool{color:var(--sx-warn);}
.jsb-bigint{color:var(--sx-red);}
.jsb-fn{color:var(--sx-text-soft);font-style:italic;}
.jsb-undef{color:var(--sx-text-soft);font-style:italic;}
.jsb-date{color:var(--sx-accent);}
.jsb-null{color:var(--sx-text-soft);}
.jsb-error{color:var(--sx-red);font-size:13px;font-family:var(--sx-mono);padding:8px;background:var(--sx-red-bg);border-radius:6px;}
.jsb-ok{color:var(--sx-green);font-size:13px;}
.jsb-issues{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;}
.jsb-issues li{font-size:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.jsb-issues code{font-size:11px;}
.jsb-desc{color:var(--sx-text-soft);}
.jsb-out-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.jsb-out-title{font-size:11px;font-family:var(--sx-mono);margin-bottom:4px;}
.jsb-out-title--native{color:var(--sx-warn);}
.jsb-out-title--safe{color:var(--sx-green);}
.jsb-pre{margin:0;padding:10px;background:var(--sx-bg);border:1px solid var(--sx-border);border-radius:6px;font-family:var(--sx-mono);font-size:11.5px;line-height:1.5;color:var(--sx-text);white-space:pre-wrap;word-break:break-all;max-height:200px;overflow:auto;}
.jsb-pre.is-err{color:var(--sx-red);border-color:rgba(239,68,68,.4);background:var(--sx-red-bg);}
.jsb-pre--safe{border-color:rgba(34,197,94,.3);background:var(--sx-green-bg);}
\`}</style>
      <div className="jsb-head">
        <h3>JSON 序列化策略实战</h3>
        <p>输入 JSON 文本或加载"危险对象"示例, 观察 <code>JSON.stringify</code> 的边界行为, 对照右侧安全序列化方案。</p>
      </div>
      <div className="jsb-grid">
        <section className="jsb-col">
          <span className="jsb-label">JSON 输入 (可编辑)</span>
          <textarea className="jsb-input" value={text} spellCheck={false} onChange={(e) => { setText(e.target.value); setLiveType(null) }} />
          <div className="jsb-chips">
            {TEXT_EXAMPLES.map((ex) => (
              <button key={ex.label} className={\`jsb-chip \${!liveType && text === ex.text ? 'is-on' : ''}\`} onClick={() => loadText(ex.text)}>{ex.label}</button>
            ))}
          </div>
          <div className="jsb-chips">
            <span className="jsb-chips-title">危险对象 ↓</span>
            {LIVE_EXAMPLES.map((ex) => (
              <button key={ex.type} className={\`jsb-chip jsb-chip--warn \${liveType === ex.type ? 'is-on' : ''}\`} onClick={() => loadLive(ex.type)}>{ex.label}</button>
            ))}
          </div>
        </section>
        <section className="jsb-col">
          <div className="jsb-card">
            <div className="jsb-card-head">解析结果 {liveType && <span className="jsb-tag jsb-tag--warn">实时对象</span>}</div>
            {parseError && !liveType ? <div className="jsb-error">语法错误: {parseError}</div> : <div className="jsb-tree-box"><Tree value={obj} /></div>}
          </div>
          <div className="jsb-card">
            <div className="jsb-card-head">陷阱分析 {issues.length > 0 && <span className="jsb-tag jsb-tag--red">{issues.length} 项</span>}</div>
            {issues.length === 0 ? <div className="jsb-ok">未检测到序列化陷阱</div> : (
              <ul className="jsb-issues">
                {issues.map((it, i) => (
                  <li key={i}><code>{it.path}</code><span className="jsb-tag jsb-tag--red">{it.tag}</span><span className="jsb-desc">{it.desc}</span></li>
                ))}
              </ul>
            )}
          </div>
          <div className="jsb-card">
            <div className="jsb-card-head">输出对比 <span className="jsb-hint">原生 vs 安全</span></div>
            <div className="jsb-out-grid">
              <div>
                <div className="jsb-out-title jsb-out-title--native">JSON.stringify (原生)</div>
                <pre className={\`jsb-pre \${native.ok ? '' : 'is-err'}\`}>{native.ok ? (native.text || '（空）') : '⚠ ' + native.text}</pre>
              </div>
              <div>
                <div className="jsb-out-title jsb-out-title--safe">safeStringify (修复)</div>
                <pre className="jsb-pre jsb-pre--safe">{safe || '（空）'}</pre>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
`,_u=`import { useCallback, useEffect, useRef, useState } from 'react'

const BUTTONS = [
  { key: 'A', label: '请求 A (慢 · 2500ms)', delay: 2500, tone: 'a' },
  { key: 'B', label: '请求 B (快 · 800ms)', delay: 800, tone: 'b' },
]
const MODES = [
  { id: 'race', name: '竞态 (有 Bug)', desc: '无保护: 后返回的请求会覆盖更新的结果' },
  { id: 'reqid', name: 'RequestId 修复', desc: '只应用最新请求, 忽略过期响应' },
  { id: 'abort', name: 'AbortController 修复', desc: '发新请求前 abort 上一个' },
]
const SCALE = 3200 // 时间轴最大刻度 (ms)

function fakeFetch(key, delay, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve({ key, delay, time: Date.now() }), delay)
    if (signal) signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')) }, { once: true })
  })
}

export default function AsyncDataSandbox() {
  const [mode, setMode] = useState('race')
  const [requests, setRequests] = useState([])
  const [current, setCurrent] = useState(null)
  const [clock, setClock] = useState(0)
  const modeRef = useRef(mode)
  const idRef = useRef(0)
  const latestRef = useRef(0)
  const abortRef = useRef(null)
  const startRef = useRef(0)

  useEffect(() => { modeRef.current = mode }, [mode])

  // 有 pending 请求时驱动时钟
  useEffect(() => {
    if (!requests.some((r) => r.status === 'pending')) return
    const iv = setInterval(() => setClock(Date.now() - startRef.current), 80)
    return () => clearInterval(iv)
  }, [requests])

  const fire = useCallback((btn) => {
    const m = modeRef.current
    const id = ++idRef.current
    if (m === 'reqid') latestRef.current = id
    let ac = null
    if (m === 'abort') {
      if (abortRef.current) { try { abortRef.current.abort() } catch { /* noop */ } }
      ac = new AbortController()
      abortRef.current = ac
    }
    if (!startRef.current) startRef.current = Date.now()
    const firedAt = Date.now() - startRef.current
    setRequests((prev) => [...prev, { id, key: btn.key, delay: btn.delay, firedAt, status: 'pending' }])
    fakeFetch(btn.key, btn.delay, ac ? ac.signal : undefined)
      .then((res) => {
        const now = Date.now() - startRef.current
        setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'resolved', resolvedAt: now, result: res } : r)))
        const m2 = modeRef.current
        if (m2 === 'reqid') {
          if (id === latestRef.current) setCurrent({ ...res, fireId: id, appliedAt: now, tag: '✓ 已应用 (最新请求)' })
          else setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'ignored' } : r)))
        } else if (m2 === 'abort') {
          setCurrent({ ...res, fireId: id, appliedAt: now, tag: '✓ 已应用' })
        } else {
          setCurrent((prev) => {
            const overwrote = prev && prev.fireId != null && prev.fireId > id
            return { ...res, fireId: id, appliedAt: now, tag: overwrote ? '⚠ 覆盖了更新的结果 (Bug!)' : '✓ 已应用' }
          })
        }
      })
      .catch(() => setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'aborted' } : r))))
  }, [])

  const reset = () => { setRequests([]); setCurrent(null); setClock(0); idRef.current = 0; latestRef.current = 0; startRef.current = 0; if (abortRef.current) { try { abortRef.current.abort() } catch { /* noop */ } } abortRef.current = null }
  const cancelNow = () => { if (abortRef.current) { try { abortRef.current.abort() } catch { /* noop */ } } }

  const maxT = Math.max(SCALE, clock, ...requests.map((r) => r.resolvedAt || 0))
  const pct = (t) => Math.max(0, Math.min(100, (t / maxT) * 100))

  return (
    <div className="adx-root">
      <style>{\`
.adx-root{font-family:var(--sx-sans);color:var(--sx-text);}
.adx-head h3{font-size:18px;margin:0 0 4px;color:var(--sx-text-h);}
.adx-head p{font-size:13px;color:var(--sx-text-soft);margin:0 0 14px;}
.adx-modes{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}
.adx-mode{padding:7px 12px;font-size:12px;background:var(--sx-bg-elev);border:1px solid var(--sx-border);border-radius:8px;color:var(--sx-text-soft);cursor:pointer;transition:all .15s;}
.adx-mode:hover{color:var(--sx-text);}
.adx-mode.is-on{background:var(--sx-accent-bg);border-color:var(--sx-accent);color:var(--sx-accent-strong);}
.adx-mode-desc{font-size:12px;color:var(--sx-text-soft);margin-bottom:14px;padding:8px 12px;background:var(--sx-bg-soft);border-left:3px solid var(--sx-cyan);border-radius:4px;}
.adx-controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px;}
.adx-btn{padding:10px 16px;font-size:13px;font-weight:600;border:none;border-radius:8px;cursor:pointer;color:#0c0a09;transition:transform .1s,filter .15s;}
.adx-btn:active{transform:translateY(1px);}
.adx-btn--a{background:var(--sx-accent);}
.adx-btn--b{background:var(--sx-cyan);}
.adx-btn:hover{filter:brightness(1.1);}
.adx-ghost{padding:8px 14px;font-size:12px;background:transparent;border:1px solid var(--sx-border-strong);border-radius:8px;color:var(--sx-text-soft);cursor:pointer;}
.adx-ghost:hover{color:var(--sx-red);border-color:var(--sx-red);}
.adx-clock{font-family:var(--sx-mono);font-size:13px;color:var(--sx-cyan);margin-left:auto;}
.adx-result{background:var(--sx-bg-soft);border:1px solid var(--sx-border);border-radius:var(--sx-radius);padding:14px;margin-bottom:16px;min-height:64px;}
.adx-result-label{font-size:11px;font-family:var(--sx-mono);color:var(--sx-text-soft);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;}
.adx-result-val{font-size:15px;color:var(--sx-text-h);font-family:var(--sx-mono);}
.adx-result-tag{display:inline-block;margin-top:6px;font-size:12px;padding:2px 8px;border-radius:4px;background:var(--sx-green-bg);color:var(--sx-green);}
.adx-result-tag.warn{background:var(--sx-red-bg);color:var(--sx-red);}
.adx-empty{color:var(--sx-text-soft);font-size:13px;font-style:italic;}
.adx-tl{background:var(--sx-bg-soft);border:1px solid var(--sx-border);border-radius:var(--sx-radius);padding:14px;}
.adx-tl-head{font-size:13px;font-weight:600;color:var(--sx-text-h);margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;}
.adx-tl-hint{font-size:11px;color:var(--sx-text-soft);font-weight:400;}
.adx-row{display:grid;grid-template-columns:90px 1fr 64px;align-items:center;gap:8px;margin-bottom:8px;font-size:12px;}
.adx-key{font-family:var(--sx-mono);font-weight:600;}
.adx-key--a{color:var(--sx-accent-strong);}
.adx-key--b{color:var(--sx-cyan);}
.adx-track{position:relative;height:18px;background:var(--sx-bg);border-radius:4px;overflow:hidden;}
.adx-bar{position:absolute;top:0;bottom:0;background:var(--sx-accent);border-radius:4px;opacity:.85;}
.adx-bar--b{background:var(--sx-cyan);}
.adx-bar--pending{background:repeating-linear-gradient(45deg,var(--sx-accent),var(--sx-accent) 4px,rgba(167,139,250,.4) 4px,rgba(167,139,250,.4) 8px);}
.adx-bar--pending.adx-bar--b{background:repeating-linear-gradient(45deg,var(--sx-cyan),var(--sx-cyan) 4px,rgba(103,232,249,.4) 4px,rgba(103,232,249,.4) 8px);}
.adx-now{position:absolute;top:-2px;bottom:-2px;width:2px;background:var(--sx-warn);box-shadow:0 0 6px var(--sx-warn);}
.adx-status{font-size:11px;font-family:var(--sx-mono);text-align:right;}
.adx-status--resolved{color:var(--sx-green);}
.adx-status--ignored{color:var(--sx-warn);}
.adx-status--aborted{color:var(--sx-red);}
.adx-status--pending{color:var(--sx-text-soft);}
\`}</style>
      <div className="adx-head">
        <h3>异步数据获取与竞态条件</h3>
        <p>点击"请求 A"后立即点击"请求 B",观察不同模式下哪个结果最终被展示。切换模式对比三种策略。</p>
      </div>
      <div className="adx-modes">
        {MODES.map((m) => (
          <button key={m.id} className={\`adx-mode \${mode === m.id ? 'is-on' : ''}\`} onClick={() => setMode(m.id)}>{m.name}</button>
        ))}
      </div>
      <div className="adx-mode-desc">{MODES.find((m) => m.id === mode).desc}</div>
      <div className="adx-controls">
        {BUTTONS.map((b) => (
          <button key={b.key} className={\`adx-btn adx-btn--\${b.tone}\`} onClick={() => fire(b)}>{b.label}</button>
        ))}
        <button className="adx-ghost" onClick={cancelNow} disabled={mode !== 'abort'}>取消在途请求</button>
        <button className="adx-ghost" onClick={reset}>重置</button>
        <span className="adx-clock">⏱ {clock}ms</span>
      </div>
      <div className="adx-result">
        <div className="adx-result-label">当前展示结果</div>
        {current ? (
          <>
            <div className="adx-result-val">{current.key} 的数据 (耗时 {current.delay}ms)</div>
            <span className={\`adx-result-tag \${current.tag.includes('Bug') ? 'warn' : ''}\`}>{current.tag}</span>
          </>
        ) : <div className="adx-empty">尚无结果,点击上方按钮发起请求</div>}
      </div>
      <div className="adx-tl">
        <div className="adx-tl-head">请求时间线 <span className="adx-tl-hint">条形 = 请求存活区间 · 黄线 = 当前时刻</span></div>
        {requests.length === 0 ? <div className="adx-empty">时间线为空</div> : requests.map((r) => {
          const end = r.status === 'pending' ? clock : (r.resolvedAt || clock)
          return (
            <div className="adx-row" key={r.id}>
              <span className={\`adx-key adx-key--\${r.key.toLowerCase()}\`}>{r.key} #{r.id}</span>
              <div className="adx-track">
                <div className={\`adx-bar \${r.status === 'pending' ? 'adx-bar--pending' : ''} \${r.key === 'B' ? 'adx-bar--b' : ''}\`} style={{ left: \`\${pct(r.firedAt)}%\`, width: \`\${pct(end) - pct(r.firedAt)}%\` }} />
                {r.status === 'pending' && <div className="adx-now" style={{ left: \`\${pct(clock)}%\` }} />}
              </div>
              <span className={\`adx-status adx-status--\${r.status}\`}>{r.status === 'resolved' ? '已返回' : r.status === 'ignored' ? '已忽略' : r.status === 'aborted' ? '已取消' : '请求中…'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
`,vu=`import { useEffect, useRef, useState } from 'react'

function pushCapped(arr, v, max) {
  const next = arr.length >= max ? arr.slice(arr.length - max + 1) : arr.slice()
  next.push(v)
  return next
}

export default function DebounceThrottleSandbox() {
  const [delay, setDelay] = useState(400)
  const [rawValue, setRawValue] = useState(50)
  const [dbValue, setDbValue] = useState(50)
  const [thValue, setThValue] = useState(50)
  const [rawCount, setRawCount] = useState(0)
  const [dbCount, setDbCount] = useState(0)
  const [thCount, setThCount] = useState(0)
  const [dbLog, setDbLog] = useState([])
  const [thLog, setThLog] = useState([])
  const [now, setNow] = useState(0)
  const [dbDeadline, setDbDeadline] = useState(0)
  const [thDeadline, setThDeadline] = useState(0)

  const dbTimer = useRef(null)
  const thLast = useRef(0)
  const burstRef = useRef(null)

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 50)
    return () => { clearInterval(iv); if (burstRef.current) clearInterval(burstRef.current); if (dbTimer.current) clearTimeout(dbTimer.current) }
  }, [])

  const emit = (val) => {
    setRawValue(val)
    setRawCount((c) => c + 1)
    // debounce: 每次都重置计时, 等到停止 delay ms 后才触发
    clearTimeout(dbTimer.current)
    setDbDeadline(Date.now() + delay)
    dbTimer.current = setTimeout(() => {
      setDbValue(val)
      setDbCount((c) => c + 1)
      setDbLog((arr) => pushCapped(arr, val, 12))
      setDbDeadline(0)
    }, delay)
    // throttle: 每 delay ms 最多触发一次 (前沿)
    const t = Date.now()
    if (t - thLast.current >= delay) {
      thLast.current = t
      setThDeadline(t + delay)
      setThValue(val)
      setThCount((c) => c + 1)
      setThLog((arr) => pushCapped(arr, val, 12))
    }
  }

  const burst = () => {
    if (burstRef.current) clearInterval(burstRef.current)
    let i = 0
    burstRef.current = setInterval(() => {
      i++
      emit(Math.floor(Math.random() * 100))
      if (i >= 24) { clearInterval(burstRef.current); burstRef.current = null }
    }, 60)
  }

  const reset = () => {
    if (burstRef.current) { clearInterval(burstRef.current); burstRef.current = null }
    if (dbTimer.current) clearTimeout(dbTimer.current)
    setRawCount(0); setDbCount(0); setThCount(0); setDbLog([]); setThLog([]); setDbDeadline(0); thLast.current = 0; setThDeadline(0)
  }

  const dbWait = dbDeadline ? Math.max(0, dbDeadline - now) : 0
  const thWait = thDeadline ? Math.max(0, thDeadline - now) : 0

  return (
    <div className="dt-root">
      <style>{\`
.dt-root{font-family:var(--sx-sans);color:var(--sx-text);}
.dt-head h3{font-size:18px;margin:0 0 4px;color:var(--sx-text-h);}
.dt-head p{font-size:13px;color:var(--sx-text-soft);margin:0 0 16px;}
.dt-ctrl{background:var(--sx-bg-soft);border:1px solid var(--sx-border);border-radius:var(--sx-radius);padding:14px;margin-bottom:14px;}
.dt-ctrl-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.dt-slider{flex:1;min-width:200px;accent-color:var(--sx-accent);}
.dt-val{font-family:var(--sx-mono);font-size:15px;color:var(--sx-accent-strong);min-width:42px;text-align:right;}
.dt-delay{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--sx-text-soft);margin-top:10px;}
.dt-delay input{accent-color:var(--sx-cyan);}
.dt-delay b{color:var(--sx-cyan);font-family:var(--sx-mono);}
.dt-actions{display:flex;gap:8px;margin-top:10px;}
.dt-btn{padding:7px 14px;font-size:12px;background:var(--sx-bg-elev);border:1px solid var(--sx-border-strong);border-radius:8px;color:var(--sx-text);cursor:pointer;transition:all .15s;}
.dt-btn:hover{border-color:var(--sx-accent);color:var(--sx-accent-strong);}
.dt-btn--danger:hover{border-color:var(--sx-red);color:var(--sx-red);}
.dt-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;}
.dt-stat{background:var(--sx-bg-soft);border:1px solid var(--sx-border);border-radius:var(--sx-radius);padding:12px;text-align:center;}
.dt-stat-num{font-size:26px;font-weight:700;font-family:var(--sx-mono);line-height:1;}
.dt-stat-label{font-size:11px;color:var(--sx-text-soft);margin-top:6px;text-transform:uppercase;letter-spacing:.05em;}
.dt-stat--raw .dt-stat-num{color:var(--sx-text-soft);}
.dt-stat--db .dt-stat-num{color:var(--sx-accent-strong);}
.dt-stat--th .dt-stat-num{color:var(--sx-cyan);}
.dt-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
@media(max-width:760px){.dt-grid{grid-template-columns:1fr;}}
.dt-panel{background:var(--sx-bg-soft);border:1px solid var(--sx-border);border-radius:var(--sx-radius);padding:14px;}
.dt-panel--db{border-top:3px solid var(--sx-accent);}
.dt-panel--th{border-top:3px solid var(--sx-cyan);}
.dt-panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
.dt-panel-name{font-size:14px;font-weight:600;color:var(--sx-text-h);}
.dt-panel-tag{font-size:11px;font-family:var(--sx-mono);padding:2px 8px;border-radius:4px;}
.dt-panel-tag--idle{color:var(--sx-green);background:var(--sx-green-bg);}
.dt-panel-tag--wait{color:var(--sx-warn);background:var(--sx-warn-bg);}
.dt-out{font-size:36px;font-family:var(--sx-mono);font-weight:700;text-align:center;padding:14px 0;border-radius:8px;background:var(--sx-bg);margin-bottom:10px;}
.dt-out--db{color:var(--sx-accent-strong);}
.dt-out--th{color:var(--sx-cyan);}
.dt-bar{height:5px;background:var(--sx-bg-elev);border-radius:3px;overflow:hidden;margin-bottom:10px;}
.dt-bar-fill{height:100%;border-radius:3px;transition:width .05s linear;}
.dt-bar-fill--db{background:var(--sx-warn);}
.dt-bar-fill--th{background:var(--sx-cyan);}
.dt-log{display:flex;gap:4px;flex-wrap:wrap;min-height:24px;}
.dt-log-dot{font-family:var(--sx-mono);font-size:11px;padding:2px 6px;border-radius:4px;background:var(--sx-bg-elev);color:var(--sx-text-soft);}
.dt-log-dot--db{background:var(--sx-accent-bg);color:var(--sx-accent-strong);}
.dt-log-dot--th{background:var(--sx-cyan-bg);color:var(--sx-cyan);}
.dt-log-empty{font-size:11px;color:var(--sx-text-soft);font-style:italic;}
\`}</style>
      <div className="dt-head">
        <h3>防抖 (Debounce) vs 节流 (Throttle)</h3>
        <p>拖动下方滑块快速触发事件,对比两种策略:防抖"停顿后才执行",节流"每段间隔最多执行一次"。</p>
      </div>
      <div className="dt-ctrl">
        <div className="dt-ctrl-row">
          <input className="dt-slider" type="range" min="0" max="100" value={rawValue} onChange={(e) => emit(Number(e.target.value))} />
          <span className="dt-val">{rawValue}</span>
        </div>
        <div className="dt-delay">
          <span>延迟 / 间隔</span>
          <input type="range" min="100" max="1200" step="50" value={delay} onChange={(e) => setDelay(Number(e.target.value))} />
          <b>{delay}ms</b>
        </div>
        <div className="dt-actions">
          <button className="dt-btn" onClick={burst}>连发测试 (24 次)</button>
          <button className="dt-btn dt-btn--danger" onClick={reset}>重置计数</button>
        </div>
      </div>
      <div className="dt-stats">
        <div className="dt-stat dt-stat--raw"><div className="dt-stat-num">{rawCount}</div><div className="dt-stat-label">原始事件</div></div>
        <div className="dt-stat dt-stat--db"><div className="dt-stat-num">{dbCount}</div><div className="dt-stat-label">防抖执行</div></div>
        <div className="dt-stat dt-stat--th"><div className="dt-stat-num">{thCount}</div><div className="dt-stat-label">节流执行</div></div>
      </div>
      <div className="dt-grid">
        <div className="dt-panel dt-panel--db">
          <div className="dt-panel-head">
            <span className="dt-panel-name">Debounce 防抖</span>
            <span className={\`dt-panel-tag \${dbWait > 0 ? 'dt-panel-tag--wait' : 'dt-panel-tag--idle'}\`}>{dbWait > 0 ? \`等待中 \${Math.ceil(dbWait)}ms\` : '已就绪'}</span>
          </div>
          <div className="dt-out dt-out--db">{dbValue}</div>
          <div className="dt-bar"><div className="dt-bar-fill dt-bar-fill--db" style={{ width: dbWait > 0 ? \`\${100 - (dbWait / delay) * 100}%\` : '100%' }} /></div>
          <div className="dt-log">{dbLog.length ? dbLog.map((v, i) => <span key={i} className="dt-log-dot dt-log-dot--db">{v}</span>) : <span className="dt-log-empty">拖动滑块后停止, 观察这里</span>}</div>
        </div>
        <div className="dt-panel dt-panel--th">
          <div className="dt-panel-head">
            <span className="dt-panel-name">Throttle 节流</span>
            <span className={\`dt-panel-tag \${thWait > 0 ? 'dt-panel-tag--wait' : 'dt-panel-tag--idle'}\`}>{thWait > 0 ? \`冷却中 \${Math.ceil(thWait)}ms\` : '已就绪'}</span>
          </div>
          <div className="dt-out dt-out--th">{thValue}</div>
          <div className="dt-bar"><div className="dt-bar-fill dt-bar-fill--th" style={{ width: thWait > 0 ? \`\${(thWait / delay) * 100}%\` : '0%' }} /></div>
          <div className="dt-log">{thLog.length ? thLog.map((v, i) => <span key={i} className="dt-log-dot dt-log-dot--th">{v}</span>) : <span className="dt-log-empty">连续拖动, 观察节流执行</span>}</div>
        </div>
      </div>
    </div>
  )
}
`,yu=`import { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react'

const useRenderCount = () => {
  const r = useRef(1)
  const [count, setCount] = useState(1)
  const skip = useRef(true)
  useEffect(() => {
    if (skip.current) { skip.current = false; return }
    r.current += 1
    skip.current = true
    setCount(r.current)
  })
  return count
}

const CounterCtx = createContext(0)
const LabelCtx = createContext('稳定配置')
const CombinedCtx = createContext({ count: 0, label: '稳定配置' })

/* ===== 卡片1: useState 直接 mutation (Bug) ===== */
function UseStateCard({ buggy }) {
  const [items, setItems] = useState(['学习 React', '修复 Bug'])
  const inputRef = useRef(null)
  const renders = useRenderCount()
  const add = () => {
    const v = inputRef.current?.value?.trim()
    if (!v) return
    if (buggy) {
      items.push(v)      // BUG: 直接 mutation 同一数组引用
      setItems(items)    // React 浅比较判定未变化, 跳过重渲染
    } else {
      setItems(items.concat(v)) // 修复: 不可变更新
    }
    if (inputRef.current) inputRef.current.value = ''
  }
  return (
    <div className="sm-card">
      <div className="sm-card-head">
        <span className="sm-card-name">useState</span>
        <span className={\`sm-badge \${buggy ? 'sm-badge--bug' : 'sm-badge--ok'}\`}>{buggy ? '直接 mutation (Bug)' : '不可变更新'}</span>
        <span className="sm-rc">渲染 {renders}</span>
      </div>
      <div className="sm-add">
        <input ref={inputRef} placeholder="输入任务后回车" onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button onClick={add}>添加</button>
      </div>
      <ul className="sm-list">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
      {buggy && <p className="sm-note sm-note--bug">⚠ 列表不更新? 因为 setState 传入了同一引用, React 跳过了更新。</p>}
    </div>
  )
}

/* ===== 卡片2: useReducer (推荐模式) ===== */
function reducer(state, action) {
  switch (action.type) {
    case 'add': return [...state, { id: Date.now(), text: action.text, done: false }]
    case 'toggle': return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t))
    default: return state
  }
}
function UseReducerCard() {
  const [todos, dispatch] = useReducer(reducer, [{ id: 1, text: '理解 reducer', done: false }])
  const [text, setText] = useState('')
  const renders = useRenderCount()
  const add = () => { if (text.trim()) { dispatch({ type: 'add', text: text.trim() }); setText('') } }
  return (
    <div className="sm-card">
      <div className="sm-card-head">
        <span className="sm-card-name">useReducer</span>
        <span className="sm-badge sm-badge--ok">推荐模式</span>
        <span className="sm-rc">渲染 {renders}</span>
      </div>
      <div className="sm-add">
        <input value={text} placeholder="输入任务后回车" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button onClick={add}>添加</button>
      </div>
      <ul className="sm-list">{todos.map((t) => (
        <li key={t.id} className={t.done ? 'is-done' : ''} onClick={() => dispatch({ type: 'toggle', id: t.id })}>{t.done ? '✓ ' : '○ '}{t.text}</li>
      ))}</ul>
      <p className="sm-note">点击任务可切换完成状态, 所有更新均为不可变。</p>
    </div>
  )
}

/* ===== 卡片3: Context 性能 (单 context vs 拆分) ===== */
function CountConsumer({ combined }) {
  const data = useContext(combined ? CombinedCtx : CounterCtx)
  const count = combined ? data.count : data
  const renders = useRenderCount()
  return (
    <div className={\`sm-consumer \${renders > 1 ? 'is-rerendered' : ''}\`}>
      <span className="sm-consumer-name">计数消费者</span>
      <b>count = {count}</b>
      <span className="sm-rc">渲染 {renders}</span>
    </div>
  )
}
function LabelConsumer({ combined }) {
  const data = useContext(combined ? CombinedCtx : LabelCtx)
  const label = combined ? data.label : data
  const renders = useRenderCount()
  return (
    <div className={\`sm-consumer \${renders > 1 ? 'is-rerendered' : ''}\`}>
      <span className="sm-consumer-name">标签消费者 (应稳定)</span>
      <b>{label}</b>
      <span className="sm-rc">渲染 {renders}</span>
    </div>
  )
}
function ContextCard({ split }) {
  const [count, setCount] = useState(0)
  const [label] = useState('稳定配置')
  return (
    <div className="sm-card">
      <div className="sm-card-head">
        <span className="sm-card-name">useContext</span>
        <span className={\`sm-badge \${split ? 'sm-badge--ok' : 'sm-badge--bug'}\`}>{split ? '拆分 Context (修复)' : '单一 Context (Bug)'}</span>
      </div>
      {split ? (
        <CounterCtx.Provider value={count}>
          <LabelCtx.Provider value={label}>
            <div className="sm-consumers"><CountConsumer combined={false} /><LabelConsumer combined={false} /></div>
          </LabelCtx.Provider>
        </CounterCtx.Provider>
      ) : (
        <CombinedCtx.Provider value={{ count, label }}>
          <div className="sm-consumers"><CountConsumer combined /><LabelConsumer combined /></div>
        </CombinedCtx.Provider>
      )}
      <button className="sm-inc" onClick={() => setCount((c) => c + 1)}>count + 1 (当前 {count})</button>
      <p className="sm-note">{split ? '✓ 拆分后, 标签消费者不再随 count 重渲染。' : '⚠ 单一 Context: count 变化时, 不关心 count 的标签消费者也被迫重渲染。'}</p>
    </div>
  )
}

export default function StateManagerSandbox() {
  const [fixed, setFixed] = useState(false)
  return (
    <div className="sm-root">
      <style>{\`
.sm-root{font-family:var(--sx-sans);color:var(--sx-text);}
.sm-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px;}
.sm-head h3{font-size:18px;margin:0;color:var(--sx-text-h);}
.sm-head p{font-size:13px;color:var(--sx-text-soft);margin:6px 0 0;}
.sm-toggle{display:inline-flex;border:1px solid var(--sx-border-strong);border-radius:8px;overflow:hidden;}
.sm-toggle button{padding:8px 14px;font-size:12px;background:transparent;border:none;color:var(--sx-text-soft);cursor:pointer;}
.sm-toggle button.is-on{background:var(--sx-accent-bg);color:var(--sx-accent-strong);}
.sm-toggle button.is-on.bug{background:var(--sx-red-bg);color:var(--sx-red);}
.sm-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
@media(max-width:900px){.sm-grid{grid-template-columns:1fr;}}
.sm-card{background:var(--sx-bg-soft);border:1px solid var(--sx-border);border-radius:var(--sx-radius);padding:14px;display:flex;flex-direction:column;gap:10px;}
.sm-card-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.sm-card-name{font-size:14px;font-weight:600;color:var(--sx-text-h);font-family:var(--sx-mono);}
.sm-badge{font-size:10px;font-family:var(--sx-mono);padding:2px 6px;border-radius:4px;}
.sm-badge--ok{color:var(--sx-green);background:var(--sx-green-bg);}
.sm-badge--bug{color:var(--sx-red);background:var(--sx-red-bg);}
.sm-rc{margin-left:auto;font-size:11px;font-family:var(--sx-mono);color:var(--sx-text-soft);}
.sm-rc{background:var(--sx-bg-elev);padding:2px 7px;border-radius:4px;}
.sm-add{display:flex;gap:6px;}
.sm-add input{flex:1;padding:7px 10px;background:var(--sx-bg);border:1px solid var(--sx-border);border-radius:6px;color:var(--sx-text-h);font-size:13px;outline:none;}
.sm-add input:focus{border-color:var(--sx-accent);}
.sm-add button{padding:7px 12px;background:var(--sx-accent);color:#0c0a09;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;}
.sm-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;max-height:120px;overflow:auto;}
.sm-list li{padding:6px 10px;background:var(--sx-bg);border-radius:6px;font-size:13px;color:var(--sx-text);}
.sm-list li.is-done{color:var(--sx-text-soft);text-decoration:line-through;cursor:pointer;}
.sm-list li:not(.is-done){cursor:pointer;}
.sm-note{font-size:11px;color:var(--sx-text-soft);margin:0;line-height:1.5;}
.sm-note--bug{color:var(--sx-red);}
.sm-consumers{display:flex;flex-direction:column;gap:8px;}
.sm-consumer{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--sx-bg);border:1px solid var(--sx-border);border-radius:6px;transition:border-color .2s,box-shadow .2s;}
.sm-consumer.is-rerendered{border-color:var(--sx-warn);box-shadow:0 0 0 1px var(--sx-warn-bg);}
.sm-consumer-name{font-size:12px;color:var(--sx-text-soft);flex:1;}
.sm-consumer b{font-family:var(--sx-mono);font-size:12px;color:var(--sx-cyan);}
.sm-inc{padding:8px 12px;background:var(--sx-bg-elev);border:1px solid var(--sx-border-strong);border-radius:6px;color:var(--sx-text);font-size:12px;cursor:pointer;}
.sm-inc:hover{border-color:var(--sx-accent);color:var(--sx-accent-strong);}
\`}</style>
      <div className="sm-head">
        <div>
          <h3>React 状态管理实战</h3>
          <p>对比三种状态模式,观察渲染计数。切换"Bug / 修复"查看差异。</p>
        </div>
        <div className="sm-toggle">
          <button className={!fixed ? 'is-on bug' : ''} onClick={() => setFixed(false)}>Bug 模式</button>
          <button className={fixed ? 'is-on' : ''} onClick={() => setFixed(true)}>修复模式</button>
        </div>
      </div>
      <div className="sm-grid">
        <UseStateCard buggy={!fixed} />
        <UseReducerCard />
        <ContextCard split={fixed} />
      </div>
    </div>
  )
}
`,bu=`import { useMemo, useState } from 'react'

const passwordChecks = (v) => ({
  len: v.length >= 8,
  upper: /[A-Z]/.test(v),
  number: /[0-9]/.test(v),
  special: /[^A-Za-z0-9]/.test(v),
})
const validateUsername = (v) => {
  if (!v) return { ok: false, msg: '用户名必填' }
  if (v.length < 3 || v.length > 20) return { ok: false, msg: '长度需 3-20 字符' }
  if (!/^[a-zA-Z0-9]+$/.test(v)) return { ok: false, msg: '仅允许字母与数字' }
  return { ok: true, msg: '用户名可用' }
}
const validateEmail = (v, buggy) => {
  if (!v) return { ok: false, msg: '邮箱必填' }
  // BUG(buggy): /^\\S+@\\S+$/ 过于宽松, 接受 a@b / user@example 等无效邮箱
  const re = buggy ? /^\\S+@\\S+$/ : /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/
  if (!re.test(v)) return { ok: false, msg: buggy ? '格式不正确' : '需有效域名 (如 a@b.com)' }
  return { ok: true, msg: '邮箱可用' }
}
const validatePassword = (v) => {
  if (!v) return { ok: false, msg: '密码必填' }
  const c = passwordChecks(v)
  if (!c.len) return { ok: false, msg: '至少 8 个字符' }
  if (!c.upper) return { ok: false, msg: '需包含大写字母' }
  if (!c.number) return { ok: false, msg: '需包含数字' }
  if (!c.special) return { ok: false, msg: '需包含特殊字符' }
  return { ok: true, msg: '密码强度合格' }
}
const validateConfirm = (v, pwd) => (!v ? { ok: false, msg: '请再次输入密码' } : v !== pwd ? { ok: false, msg: '两次密码不一致' } : { ok: true, msg: '密码一致' })
const strength = (v) => {
  if (!v) return 0
  const c = passwordChecks(v)
  let s = 0
  if (c.len) s++
  if (c.upper && c.number && c.special) s++
  if (v.length >= 12 && c.upper && c.number && c.special) s++
  return s
}
const STRENGTH_LABEL = ['', '弱', '中', '强']
const TEST_EMAILS = [
  { v: 'user@example.com', tip: '应有效' },
  { v: 'a@b', tip: '无效(无域名/TLD)' },
  { v: 'user@example', tip: '无效(无TLD)' },
  { v: 'user@.com', tip: '无效(无域名主体)' },
]

function Field({ label, status, touched, children }) {
  return (
    <label className="fv-field">
      <span className="fv-label">{label}</span>
      {children}
      <span className={\`fv-msg \${touched ? (status.ok ? 'fv-msg--ok' : 'fv-msg--err') : 'fv-msg--idle'}\`}>
        {touched ? (status.ok ? '✓ ' : '✗ ') + status.msg : '等待输入…'}
      </span>
    </label>
  )
}

export default function FormValidationSandbox() {
  const [buggy, setBuggy] = useState(true)
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setTouched((t) => ({ ...t, [k]: true })); setSubmitted(false) }

  const s = useMemo(() => ({
    username: validateUsername(form.username),
    email: validateEmail(form.email, buggy),
    password: validatePassword(form.password),
    confirm: validateConfirm(form.confirm, form.password),
  }), [form, buggy])
  const allValid = s.username.ok && s.email.ok && s.password.ok && s.confirm.ok
  const pwStr = strength(form.password)

  return (
    <div className="fv-root">
      <style>{\`
.fv-root{font-family:var(--sx-sans);color:var(--sx-text);max-width:640px;}
.fv-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;}
.fv-head h3{font-size:18px;margin:0;color:var(--sx-text-h);}
.fv-head p{font-size:13px;color:var(--sx-text-soft);margin:6px 0 0;}
.fv-toggle{display:inline-flex;border:1px solid var(--sx-border-strong);border-radius:8px;overflow:hidden;}
.fv-toggle button{padding:7px 12px;font-size:12px;background:transparent;border:none;color:var(--sx-text-soft);cursor:pointer;}
.fv-toggle button.is-on.bug{background:var(--sx-red-bg);color:var(--sx-red);}
.fv-toggle button.is-on.fix{background:var(--sx-green-bg);color:var(--sx-green);}
.fv-form{background:var(--sx-bg-soft);border:1px solid var(--sx-border);border-radius:var(--sx-radius);padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:14px;}
@media(max-width:560px){.fv-form{grid-template-columns:1fr;}}
.fv-field{display:flex;flex-direction:column;gap:5px;}
.fv-label{font-size:12px;color:var(--sx-text-soft);font-family:var(--sx-mono);}
.fv-input{width:100%;padding:9px 12px;background:var(--sx-bg);border:1px solid var(--sx-border);border-radius:6px;color:var(--sx-text-h);font-size:14px;outline:none;transition:border-color .15s;}
.fv-input:focus{border-color:var(--sx-accent);}
.fv-input.is-ok{border-color:var(--sx-green);}
.fv-input.is-err{border-color:var(--sx-red);}
.fv-msg{font-size:11px;min-height:14px;}
.fv-msg--ok{color:var(--sx-green);}
.fv-msg--err{color:var(--sx-red);}
.fv-msg--idle{color:var(--sx-text-soft);}
.fv-strength{display:flex;align-items:center;gap:6px;margin-top:-2px;}
.fv-bars{display:flex;gap:3px;flex:1;}
.fv-bar{height:5px;flex:1;background:var(--sx-bg-elev);border-radius:3px;transition:background .2s;}
.fv-bar.on-1{background:var(--sx-red);}
.fv-bar.on-2{background:var(--sx-warn);}
.fv-bar.on-3{background:var(--sx-green);}
.fv-str-label{font-size:11px;font-family:var(--sx-mono);min-width:24px;text-align:right;}
.fv-tests{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px;align-items:center;}
.fv-tests span{font-size:11px;color:var(--sx-text-soft);font-family:var(--sx-mono);}
.fv-test{padding:3px 8px;font-size:11px;background:var(--sx-bg-elev);border:1px solid var(--sx-border);border-radius:5px;color:var(--sx-text-soft);cursor:pointer;transition:all .15s;}
.fv-test:hover{border-color:var(--sx-cyan);color:var(--sx-cyan);}
.fv-submit{margin-top:14px;width:100%;padding:11px;font-size:14px;font-weight:600;border:none;border-radius:8px;cursor:pointer;transition:all .15s;}
.fv-submit:disabled{background:var(--sx-bg-elev);color:var(--sx-text-soft);cursor:not-allowed;}
.fv-submit:not(:disabled){background:var(--sx-green);color:#0c0a09;}
.fv-submit:not(:disabled):hover{filter:brightness(1.1);}
.fv-success{margin-top:10px;padding:10px 12px;background:var(--sx-green-bg);border:1px solid var(--sx-green);border-radius:8px;color:var(--sx-green);font-size:13px;}
\`}</style>
      <div className="fv-head">
        <div><h3>表单实时验证</h3><p>填写表单,观察实时校验。邮箱正则可切换"宽松(Bug)/严格(修复)"。</p></div>
        <div className="fv-toggle">
          <button className={\`bug \${buggy ? 'is-on' : ''}\`} onClick={() => setBuggy(true)}>宽松正则 (Bug)</button>
          <button className={\`fix \${!buggy ? 'is-on' : ''}\`} onClick={() => setBuggy(false)}>严格正则 (修复)</button>
        </div>
      </div>
      <form className="fv-form" onSubmit={(e) => { e.preventDefault(); if (allValid) setSubmitted(true) }}>
        <Field label="用户名 (3-20, 字母数字)" status={s.username} touched={touched.username}>
          <input className={\`fv-input \${touched.username ? (s.username.ok ? 'is-ok' : 'is-err') : ''}\`} value={form.username} onChange={(e) => set('username', e.target.value)} placeholder="alice2024" />
        </Field>
        <Field label="邮箱" status={s.email} touched={touched.email}>
          <input className={\`fv-input \${touched.email ? (s.email.ok ? 'is-ok' : 'is-err') : ''}\`} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="密码 (8+, 大写+数字+特殊符)" status={s.password} touched={touched.password}>
          <input className={\`fv-input \${touched.password ? (s.password.ok ? 'is-ok' : 'is-err') : ''}\`} type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Abc123!@" />
          <div className="fv-strength">
            <div className="fv-bars">{[1, 2, 3].map((i) => <span key={i} className={\`fv-bar \${pwStr >= i ? 'on-' + pwStr : ''}\`} />)}</div>
            <span className="fv-str-label">{STRENGTH_LABEL[pwStr]}</span>
          </div>
        </Field>
        <Field label="确认密码" status={s.confirm} touched={touched.confirm}>
          <input className={\`fv-input \${touched.confirm ? (s.confirm.ok ? 'is-ok' : 'is-err') : ''}\`} type="password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} placeholder="再次输入密码" />
        </Field>
        <div className="fv-tests">
          <span>邮箱用例 ↓</span>
          {TEST_EMAILS.map((t) => (
            <button type="button" key={t.v} className="fv-test" onClick={() => set('email', t.v)} title={t.tip}>{t.v}</button>
          ))}
        </div>
        <button type="submit" className="fv-submit" disabled={!allValid}>{allValid ? '提交注册' : '请完成所有字段'}</button>
      </form>
      {submitted && <div className="fv-success">✓ 提交成功! 表单数据已通过全部校验。</div>}
    </div>
  )
}
`,xu=`import { useCallback, useEffect, useRef, useState } from 'react'

function LifecycleDemo({ count, multiplier, fixed, running, onLog }) {
  const [tick, setTick] = useState(0)
  const [effectResult, setEffectResult] = useState(null)
  const prevCount = useRef(count)
  const prevMult = useRef(multiplier)
  const prevFixed = useRef(fixed)
  const didMount = useRef(false)

  // Effect#1: 仅挂载时执行 (模拟 fetch)
  useEffect(() => {
    onLog('mount', 'Effect#1 挂载 → 模拟 fetch /api/data')
    return () => onLog('cleanup', 'Effect#1 卸载 → 取消请求')
  }, [onLog])

  // Effect#2: 定时器, 依赖 running (演示 run → cleanup → re-run)
  useEffect(() => {
    if (!running) return
    onLog('run', 'Effect#2 启动定时器 (每秒 +1)')
    const iv = setInterval(() => setTick((t) => t + 1), 1000)
    return () => { clearInterval(iv); onLog('cleanup', 'Effect#2 清除定时器') }
  }, [running, onLog])

  // Effect#3: 缺失依赖 Bug — multiplier 未列入 deps (仅日志, setState 移至追踪 effect)
  useEffect(() => {
    const result = count * multiplier
    onLog('run', \`Effect#3 运行: \${count} × \${multiplier} = \${result}\`)
    return () => onLog('cleanup', 'Effect#3 清理 (deps 变更前)')
  }, fixed ? [count, multiplier, onLog] : [count, onLog])

  // 追踪 effectResult: 复刻 Effect#3 运行条件 (mount/count/fixed下multiplier/fixed切换)
  useEffect(() => {
    const countChanged = prevCount.current !== count
    const multChanged = prevMult.current !== multiplier
    const fixedChanged = prevFixed.current !== fixed
    const firstRun = !didMount.current
    const shouldRun = firstRun || countChanged || (fixed && multChanged) || fixedChanged
    prevCount.current = count
    prevMult.current = multiplier
    prevFixed.current = fixed
    didMount.current = true
    if (shouldRun) {
      setEffectResult(count * multiplier)
    }
  })

  const live = count * multiplier
  const stale = !fixed && effectResult !== null && effectResult !== live
  return (
    <div className="ue-child">
      <div className="ue-child-row">定时器 tick: <b>{tick}</b> <span className="ue-muted">{running ? '⏱ 运行中' : '⏸ 已暂停'}</span></div>
      <div className={\`ue-child-row \${stale ? 'is-stale' : ''}\`}>
        实时计算: <b className="ue-live">{live}</b>
        <span className="ue-arrow">→</span>
        Effect 内捕获: <b className="ue-cap">{effectResult ?? '—'}</b>
        {stale && <span className="ue-stale-tag">⚠ 闭包过期 (multiplier 未在 deps)</span>}
      </div>
      <div className="ue-child-row">deps: <code>{fixed ? '[count, multiplier, onLog]' : '[count, onLog] ← 缺 multiplier'}</code></div>
    </div>
  )
}

const TYPE_META = {
  mount: { label: '挂载', color: 'var(--sx-green)' },
  run: { label: '运行', color: 'var(--sx-cyan)' },
  cleanup: { label: '清理', color: 'var(--sx-warn)' },
  skip: { label: '跳过', color: 'var(--sx-text-soft)' },
}

export default function UseEffectSandbox() {
  const [logs, setLogs] = useState([])
  const [count, setCount] = useState(1)
  const [multiplier, setMultiplier] = useState(2)
  const [fixed, setFixed] = useState(false)
  const [running, setRunning] = useState(true)
  const [mounted, setMounted] = useState(true)
  const pushLog = useCallback((type, msg) => {
    setLogs((prev) => {
      const id = prev.length ? prev[prev.length - 1].id + 1 : 0
      const next = [...prev, { id, type, msg, t: Date.now() }]
      return next.length > 60 ? next.slice(next.length - 60) : next
    })
  }, [])
  const minT = logs.length ? logs[0].t : 0

  return (
    <div className="ue-root">
      <style>{\`
.ue-root{font-family:var(--sx-sans);color:var(--sx-text);}
.ue-head h3{font-size:18px;margin:0 0 4px;color:var(--sx-text-h);}
.ue-head p{font-size:13px;color:var(--sx-text-soft);margin:0 0 14px;}
.ue-controls{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;}
.ue-btn{padding:7px 12px;font-size:12px;background:var(--sx-bg-elev);border:1px solid var(--sx-border-strong);border-radius:8px;color:var(--sx-text);cursor:pointer;transition:all .15s;}
.ue-btn:hover{border-color:var(--sx-accent);color:var(--sx-accent-strong);}
.ue-btn.is-on{background:var(--sx-accent-bg);border-color:var(--sx-accent);color:var(--sx-accent-strong);}
.ue-btn--bug.is-on{background:var(--sx-red-bg);border-color:var(--sx-red);color:var(--sx-red);}
.ue-btn--ok.is-on{background:var(--sx-green-bg);border-color:var(--sx-green);color:var(--sx-green);}
.ue-btn--danger:hover{border-color:var(--sx-red);color:var(--sx-red);}
.ue-grid{display:grid;grid-template-columns:1fr 1.3fr;gap:14px;}
@media(max-width:820px){.ue-grid{grid-template-columns:1fr;}}
.ue-child{background:var(--sx-bg-soft);border:1px solid var(--sx-border);border-radius:var(--sx-radius);padding:14px;display:flex;flex-direction:column;gap:10px;}
.ue-child-row{font-size:13px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.ue-child-row code{font-size:11px;}
.ue-muted{color:var(--sx-text-soft);font-size:12px;}
.ue-live{color:var(--sx-cyan);font-family:var(--sx-mono);}
.ue-cap{color:var(--sx-accent-strong);font-family:var(--sx-mono);}
.ue-arrow{color:var(--sx-text-soft);}
.ue-is-stale,.ue-child-row.is-stale{color:var(--sx-red);}
.ue-stale-tag{font-size:11px;background:var(--sx-red-bg);color:var(--sx-red);padding:1px 6px;border-radius:4px;}
.ue-tl{background:var(--sx-bg-soft);border:1px solid var(--sx-border);border-radius:var(--sx-radius);padding:12px;}
.ue-tl-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
.ue-tl-title{font-size:13px;font-weight:600;color:var(--sx-text-h);}
.ue-legend{display:flex;gap:8px;font-size:11px;color:var(--sx-text-soft);}
.ue-legend span{display:flex;align-items:center;gap:4px;}
.ue-legend i{width:8px;height:8px;border-radius:50%;display:inline-block;}
.ue-tl-list{list-style:none;margin:0;padding:0;max-height:340px;overflow:auto;position:relative;}
.ue-tl-list::before{content:'';position:absolute;left:5px;top:6px;bottom:6px;width:2px;background:var(--sx-border);}
.ue-tl-item{position:relative;padding:5px 0 5px 22px;font-size:12px;display:flex;gap:8px;align-items:baseline;}
.ue-tl-item::before{content:'';position:absolute;left:1px;top:9px;width:10px;height:10px;border-radius:50%;background:var(--dot,var(--sx-text-soft));border:2px solid var(--sx-bg-soft);box-shadow:0 0 6px var(--dot,var(--sx-text-soft));}
.ue-tl-time{font-family:var(--sx-mono);color:var(--sx-text-soft);font-size:10px;min-width:42px;}
.ue-tl-type{font-family:var(--sx-mono);font-size:10px;padding:0 5px;border-radius:3px;}
.ue-tl-msg{color:var(--sx-text);}
.ue-empty{color:var(--sx-text-soft);font-size:12px;font-style:italic;padding:8px 0;}
\`}</style>
      <div className="ue-head">
        <h3>useEffect 生命周期可视化</h3>
        <p>观察三个 Effect 的挂载、运行、清理、重运行周期。Effect#3 故意缺失依赖,演示闭包过期 Bug。</p>
      </div>
      <div className="ue-controls">
        <button className="ue-btn" onClick={() => setCount((c) => c + 1)}>count + 1 (={count})</button>
        <button className="ue-btn" onClick={() => setMultiplier((m) => (m === 2 ? 3 : 2))}>multiplier 切换 (={multiplier})</button>
        <button className={\`ue-btn \${running ? 'is-on' : ''}\`} onClick={() => setRunning((r) => !r)}>{running ? '定时器: 开' : '定时器: 关'}</button>
        <button className={\`ue-btn \${fixed ? 'ue-btn--ok is-on' : 'ue-btn--bug is-on'}\`} onClick={() => setFixed((f) => !f)}>{fixed ? '依赖: 完整' : '依赖: 缺失 (Bug)'}</button>
        <button className={\`ue-btn \${mounted ? 'is-on' : ''}\`} onClick={() => setMounted((m) => !m)}>{mounted ? '已挂载' : '已卸载'}</button>
        <button className="ue-btn ue-btn--danger" onClick={() => setLogs([])}>清空时间线</button>
      </div>
      <div className="ue-grid">
        {mounted ? (
          <LifecycleDemo count={count} multiplier={multiplier} fixed={fixed} running={running} onLog={pushLog} />
        ) : (
          <div className="ue-child"><div className="ue-empty">组件已卸载,清理函数已执行 (见右侧时间线)</div></div>
        )}
        <div className="ue-tl">
          <div className="ue-tl-head">
            <span className="ue-tl-title">生命周期时间线</span>
            <span className="ue-legend">{Object.entries(TYPE_META).map(([k, v]) => <span key={k}><i style={{ background: v.color }} />{v.label}</span>)}</span>
          </div>
          {logs.length === 0 ? <div className="ue-empty">尚无事件,操作左侧控件或切换挂载状态</div> : (
            <ul className="ue-tl-list">
              {logs.map((l) => (
                <li key={l.id} className="ue-tl-item" style={{ ['--dot']: TYPE_META[l.type]?.color }}>
                  <span className="ue-tl-time">+{l.t - minT}ms</span>
                  <span className="ue-tl-type" style={{ color: TYPE_META[l.type]?.color }}>{TYPE_META[l.type]?.label}</span>
                  <span className="ue-tl-msg">{l.msg}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
`,Su=`import { createContext, memo, useContext, useEffect, useRef, useState } from 'react'

const useRenderCount = () => {
  const r = useRef(1)
  const [count, setCount] = useState(1)
  const skip = useRef(true)
  useEffect(() => {
    if (skip.current) { skip.current = false; return }
    r.current += 1
    skip.current = true
    setCount(r.current)
  })
  return count
}
const ThemeCtx = createContext({ color: '#f97316', label: '极客主题' })
const ColorCtx = createContext('#f97316')
const LabelCtx = createContext('极客主题')
const COLORS = ['#f97316', '#14b8a6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899']
const LABELS = ['极客主题', '商务主题', '简约主题']

function ConsumerCard({ name, value, renders, uses, hot }) {
  return (
    <div className={\`cp-consumer \${hot ? 'is-hot' : ''}\`}>
      <div className="cp-consumer-head"><span className="cp-consumer-name">{name}</span><span className="cp-uses">{uses}</span></div>
      <div className="cp-consumer-val">{value}</div>
      <div className="cp-consumer-rc">渲染 <b>{renders}</b> 次</div>
    </div>
  )
}
const Swatch = memo(function Swatch({ combined }) {
  const data = useContext(combined ? ThemeCtx : ColorCtx)
  const color = combined ? data.color : data
  return <ConsumerCard name="色块组件" value={<span className="cp-dot" style={{ background: color }} />} renders={useRenderCount()} uses="读 color" hot />
})
const StaticInfo = memo(function StaticInfo({ combined }) {
  const data = useContext(combined ? ThemeCtx : LabelCtx)
  const label = combined ? data.label : data
  return <ConsumerCard name="信息组件" value={label} renders={useRenderCount()} uses="读 label (应稳定)" />
})

function Panel({ title, tone, children, note }) {
  return (
    <div className={\`cp-panel cp-panel--\${tone}\`}>
      <div className="cp-panel-head"><span className="cp-panel-title">{title}</span></div>
      <div className="cp-consumers">{children}</div>
      <p className="cp-note">{note}</p>
    </div>
  )
}

export default function ContextPerfSandbox() {
  const [color, setColor] = useState(COLORS[0])
  const [label, setLabel] = useState(LABELS[0])
  const burstRef = useRef(null)
  const parentRenders = useRenderCount()
  useEffect(() => () => { if (burstRef.current) clearInterval(burstRef.current) }, [])
  const burst = () => {
    if (burstRef.current) clearInterval(burstRef.current)
    let i = 0
    burstRef.current = setInterval(() => { setColor(COLORS[Math.floor(Math.random() * COLORS.length)]); if (++i >= 14) { clearInterval(burstRef.current); burstRef.current = null } }, 110)
  }
  return (
    <div className="cp-root">
      <style>{\`
.cp-root{font-family:var(--sx-sans);color:var(--sx-text);}
.cp-head h3{font-size:18px;margin:0 0 4px;color:var(--sx-text-h);}
.cp-head p{font-size:13px;color:var(--sx-text-soft);margin:0 0 14px;}
.cp-controls{background:var(--sx-bg-soft);border:1px solid var(--sx-border);border-radius:var(--sx-radius);padding:12px;margin-bottom:14px;display:flex;flex-direction:column;gap:10px;}
.cp-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.cp-row-label{font-size:11px;color:var(--sx-text-soft);font-family:var(--sx-mono);min-width:64px;}
.cp-swatch-btn{width:26px;height:26px;border-radius:6px;border:2px solid transparent;cursor:pointer;transition:transform .1s;}
.cp-swatch-btn:hover{transform:scale(1.12);}
.cp-swatch-btn.is-on{border-color:var(--sx-text-h);box-shadow:0 0 0 2px var(--sx-bg-soft);}
.cp-label-btn{padding:5px 10px;font-size:12px;background:var(--sx-bg-elev);border:1px solid var(--sx-border);border-radius:6px;color:var(--sx-text-soft);cursor:pointer;}
.cp-label-btn.is-on{background:var(--sx-cyan-bg);border-color:var(--sx-cyan);color:var(--sx-cyan);}
.cp-burst{margin-left:auto;padding:7px 12px;font-size:12px;background:var(--sx-accent);color:#0c0a09;border:none;border-radius:6px;font-weight:600;cursor:pointer;}
.cp-parent{font-size:11px;color:var(--sx-text-soft);font-family:var(--sx-mono);}
.cp-parent b{color:var(--sx-warn);}
.cp-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
@media(max-width:760px){.cp-grid{grid-template-columns:1fr;}}
.cp-panel{background:var(--sx-bg-soft);border:1px solid var(--sx-border);border-radius:var(--sx-radius);padding:14px;}
.cp-panel--naive{border-top:3px solid var(--sx-red);}
.cp-panel--opt{border-top:3px solid var(--sx-green);}
.cp-panel-title{font-size:14px;font-weight:600;color:var(--sx-text-h);}
.cp-panel-head{margin-bottom:10px;}
.cp-consumers{display:flex;flex-direction:column;gap:8px;}
.cp-consumer{padding:10px;border:1px solid var(--sx-border);border-radius:8px;background:var(--sx-bg);transition:border-color .2s,box-shadow .2s;}
.cp-consumer.is-hot{border-color:var(--sx-warn);box-shadow:0 0 0 1px var(--sx-warn-bg);}
.cp-consumer-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.cp-consumer-name{font-size:13px;font-weight:600;color:var(--sx-text-h);}
.cp-uses{font-size:10px;font-family:var(--sx-mono);color:var(--sx-text-soft);background:var(--sx-bg-elev);padding:1px 6px;border-radius:4px;}
.cp-consumer-val{font-size:14px;color:var(--sx-text);min-height:22px;display:flex;align-items:center;}
.cp-dot{display:inline-block;width:20px;height:20px;border-radius:5px;border:1px solid rgba(255,255,255,.15);}
.cp-consumer-rc{margin-top:6px;font-size:11px;color:var(--sx-text-soft);font-family:var(--sx-mono);}
.cp-consumer-rc b{color:var(--sx-cyan);font-size:13px;}
.cp-note{font-size:11px;color:var(--sx-text-soft);margin:10px 0 0;line-height:1.5;}
\`}</style>
      <div className="cp-head">
        <h3>Context 性能诊断</h3>
        <p>左侧"单一 Context":改 color 时连只读 label 的组件也被迫重渲染。右侧"拆分 Context":只有读 color 的组件重渲染。点击"连发改色"看渲染计数分化。</p>
      </div>
      <div className="cp-controls">
        <div className="cp-row">
          <span className="cp-row-label">color (频繁)</span>
          {COLORS.map((c) => <button key={c} className={\`cp-swatch-btn \${color === c ? 'is-on' : ''}\`} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />)}
          <button className="cp-burst" onClick={burst}>连发改色 ×14</button>
        </div>
        <div className="cp-row">
          <span className="cp-row-label">label (低频)</span>
          {LABELS.map((l) => <button key={l} className={\`cp-label-btn \${label === l ? 'is-on' : ''}\`} onClick={() => setLabel(l)}>{l}</button>)}
          <span className="cp-parent">父组件渲染 <b>{parentRenders}</b> 次</span>
        </div>
      </div>
      <div className="cp-grid">
        <Panel title="单一 Context (Bug)" tone="naive" note="⚠ value={{color,label}} 每次都是新对象, 所有消费者都重渲染。">
          <ThemeCtx.Provider value={{ color, label }}>
            <Swatch combined />
            <StaticInfo combined />
          </ThemeCtx.Provider>
        </Panel>
        <Panel title="拆分 Context (修复)" tone="opt" note="✓ color 与 label 分属两个 Context, 改 color 只影响读 color 的组件。">
          <ColorCtx.Provider value={color}>
            <LabelCtx.Provider value={label}>
              <Swatch combined={false} />
              <StaticInfo combined={false} />
            </LabelCtx.Provider>
          </ColorCtx.Provider>
        </Panel>
      </div>
    </div>
  )
}
`,Cu=`import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

const useRenderCount = () => {
  const r = useRef(1)
  const [count, setCount] = useState(1)
  const skip = useRef(true)
  useEffect(() => {
    if (skip.current) { skip.current = false; return }
    r.current += 1
    skip.current = true
    setCount(r.current)
  })
  return count
}

const ITEMS = [
  { id: 1, label: '苹果' }, { id: 2, label: '香蕉' }, { id: 3, label: '樱桃' },
  { id: 4, label: '葡萄' }, { id: 5, label: '芒果' }, { id: 6, label: '橙子' },
]

const Child = memo(function Child({ label, selected, onSelect, onSelectInline }) {
  const renders = useRenderCount()
  // onSelectInline 仅在 Bug 模式传入新函数, 会破坏 memo
  const handle = onSelect || onSelectInline
  return (
    <button className={\`mo-child \${selected ? 'is-selected' : ''}\`} onClick={handle}>
      <span className="mo-child-label">{label}</span>
      {selected && <span className="mo-child-sel">● 已选中</span>}
      <span className="mo-child-rc">渲染 ×{renders}</span>
    </button>
  )
})

export default function MemoSandbox() {
  const [count, setCount] = useState(0)
  const [selectedId, setSelectedId] = useState(3)
  const [optimized, setOptimized] = useState(false)
  const parentRenders = useRenderCount()
  const [statsCompute, setStatsCompute] = useState(1)
  const prevSel = useRef(selectedId)

  const handleSelect = useCallback((id) => setSelectedId(id), [])
  // useMemo 示例: 仅在 selectedId 变化时重算
  const stats = useMemo(() => ({ total: ITEMS.length, selected: selectedId }), [selectedId])
  useEffect(() => {
    if (prevSel.current !== selectedId) {
      prevSel.current = selectedId
      setStatsCompute((c) => c + 1)
    }
  })

  return (
    <div className="mo-root">
      <style>{\`
.mo-root{font-family:var(--sx-sans);color:var(--sx-text);}
.mo-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;}
.mo-head h3{font-size:18px;margin:0 0 4px;color:var(--sx-text-h);}
.mo-head p{font-size:13px;color:var(--sx-text-soft);margin:0;}
.mo-toggle{display:inline-flex;border:1px solid var(--sx-border-strong);border-radius:8px;overflow:hidden;}
.mo-toggle button{padding:7px 12px;font-size:12px;background:transparent;border:none;color:var(--sx-text-soft);cursor:pointer;}
.mo-toggle button.is-on.bug{background:var(--sx-red-bg);color:var(--sx-red);}
.mo-toggle button.is-on.fix{background:var(--sx-green-bg);color:var(--sx-green);}
.mo-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;}
@media(max-width:620px){.mo-stats{grid-template-columns:repeat(2,1fr);}}
.mo-stat{background:var(--sx-bg-soft);border:1px solid var(--sx-border);border-radius:var(--sx-radius);padding:10px 12px;}
.mo-stat-label{font-size:11px;color:var(--sx-text-soft);font-family:var(--sx-mono);text-transform:uppercase;letter-spacing:.04em;}
.mo-stat-val{font-size:20px;font-weight:700;font-family:var(--sx-mono);margin-top:2px;}
.mo-stat--c .mo-stat-val{color:var(--sx-accent-strong);}
.mo-stat--p .mo-stat-val{color:var(--sx-warn);}
.mo-stat--s .mo-stat-val{color:var(--sx-cyan);}
.mo-controls{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;}
.mo-btn{padding:9px 14px;font-size:13px;background:var(--sx-bg-elev);border:1px solid var(--sx-border-strong);border-radius:8px;color:var(--sx-text);cursor:pointer;transition:all .15s;}
.mo-btn:hover{border-color:var(--sx-accent);color:var(--sx-accent-strong);}
.mo-btn--primary{background:var(--sx-accent);color:#0c0a09;border:none;font-weight:600;}
.mo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
@media(max-width:620px){.mo-grid{grid-template-columns:repeat(2,1fr);}}
.mo-child{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:12px;background:var(--sx-bg-soft);border:1px solid var(--sx-border);border-radius:8px;cursor:pointer;text-align:left;transition:all .15s;min-height:78px;}
.mo-child:hover{border-color:var(--sx-accent);}
.mo-child.is-selected{border-color:var(--sx-green);box-shadow:0 0 0 1px var(--sx-green-bg);}
.mo-child-label{font-size:15px;color:var(--sx-text-h);font-weight:600;}
.mo-child-sel{font-size:11px;color:var(--sx-green);}
.mo-child-rc{margin-top:auto;font-size:11px;font-family:var(--sx-mono);color:var(--sx-text-soft);background:var(--sx-bg);padding:2px 7px;border-radius:4px;align-self:flex-end;}
.mo-note{font-size:12px;color:var(--sx-text-soft);margin-top:14px;padding:10px 12px;background:var(--sx-bg-soft);border-left:3px solid var(--sx-cyan);border-radius:4px;line-height:1.6;}
.mo-note b{color:var(--sx-text-h);}
\`}</style>
      <div className="mo-head">
        <div>
          <h3>React.memo 性能优化</h3>
          <p>"无关计数器"变化时, 子项本不该重渲染。Bug 模式下内联回调破坏 memo, 全员重渲染。</p>
        </div>
        <div className="mo-toggle">
          <button className={\`bug \${!optimized ? 'is-on' : ''}\`} onClick={() => setOptimized(false)}>无 memo (Bug)</button>
          <button className={\`fix \${optimized ? 'is-on' : ''}\`} onClick={() => setOptimized(true)}>memo + useCallback (修复)</button>
        </div>
      </div>
      <div className="mo-stats">
        <div className="mo-stat mo-stat--c"><div className="mo-stat-label">无关计数器</div><div className="mo-stat-val">{count}</div></div>
        <div className="mo-stat mo-stat--p"><div className="mo-stat-label">父组件渲染</div><div className="mo-stat-val">{parentRenders}</div></div>
        <div className="mo-stat mo-stat--s"><div className="mo-stat-label">useMemo 重算</div><div className="mo-stat-val">{statsCompute}</div></div>
        <div className="mo-stat"><div className="mo-stat-label">选中项</div><div className="mo-stat-val">#{stats.selected}/{stats.total}</div></div>
      </div>
      <div className="mo-controls">
        <button className="mo-btn mo-btn--primary" onClick={() => setCount((c) => c + 1)}>无关计数器 +1</button>
        <button className="mo-btn" onClick={() => { for (let i = 0; i < 6; i++) setCount((c) => c + 1) }}>连按 6 次</button>
      </div>
      <div className="mo-grid">
        {ITEMS.map((it) => {
          const selected = selectedId === it.id
          return optimized ? (
            <Child key={it.id} label={it.label} selected={selected} onSelect={handleSelect} />
          ) : (
            <Child key={it.id} label={it.label} selected={selected} onSelectInline={() => setSelectedId(it.id)} />
          )
        })}
      </div>
      <p className="mo-note">
        <b>Bug 模式</b>:每次渲染都生成新的内联回调 <code>() =&gt; setSelectedId(it.id)</code>,React.memo 比对 props 时发现 onSelect 变了, 子组件被迫重渲染——即便"无关计数器"与子项毫无关系。<br />
        <b>修复模式</b>:用 <code>useCallback</code> 稳定回调 + <code>React.memo</code>,只有 props 真正变化(选中态切换)的子项才重渲染。点击子项时, 只有新旧两个选中项的渲染计数增长。
      </p>
    </div>
  )
}
`,wu=`import { useMemo, useRef, useState } from 'react'

const TOTAL = 10000
const ITEM_H = 34
const VIEW_H = 440
const BUFFER = 4
const ITEMS = Array.from({ length: TOTAL }, (_, i) => ({
  id: i,
  text: \`列表项 #\${String(i + 1).padStart(4, '0')}\`,
  desc: ['基础数据', '扩展配置', '缓存条目', '日志记录'][i % 4],
}))

export default function VirtualListSandbox() {
  const [mode, setMode] = useState('virtual')
  const [scrollTop, setScrollTop] = useState(0)
  const scrollRef = useRef(null)

  const start = Math.max(0, Math.floor(scrollTop / ITEM_H) - BUFFER)
  const visibleCount = Math.ceil(VIEW_H / ITEM_H) + BUFFER * 2
  const end = Math.min(TOTAL, start + visibleCount)
  const slice = useMemo(() => ITEMS.slice(start, end), [start, end])
  const scrollPct = Math.round((scrollTop / (TOTAL * ITEM_H - VIEW_H)) * 100) || 0

  const onScroll = (e) => {
    if (mode === 'virtual') setScrollTop(e.target.scrollTop)
  }
  const jumpTo = (pct) => {
    const top = (pct / 100) * (TOTAL * ITEM_H - VIEW_H)
    if (scrollRef.current) scrollRef.current.scrollTop = top
    setScrollTop(top)
  }

  return (
    <div className="vl-root">
      <style>{\`
.vl-root{font-family:var(--sx-sans);color:var(--sx-text);}
.vl-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;}
.vl-head h3{font-size:18px;margin:0 0 4px;color:var(--sx-text-h);}
.vl-head p{font-size:13px;color:var(--sx-text-soft);margin:0;}
.vl-toggle{display:inline-flex;border:1px solid var(--sx-border-strong);border-radius:8px;overflow:hidden;}
.vl-toggle button{padding:7px 12px;font-size:12px;background:transparent;border:none;color:var(--sx-text-soft);cursor:pointer;}
.vl-toggle button.is-on.naive{background:var(--sx-red-bg);color:var(--sx-red);}
.vl-toggle button.is-on.virt{background:var(--sx-green-bg);color:var(--sx-green);}
.vl-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;}
@media(max-width:620px){.vl-metrics{grid-template-columns:repeat(2,1fr);}}
.vl-metric{background:var(--sx-bg-soft);border:1px solid var(--sx-border);border-radius:var(--sx-radius);padding:10px 12px;}
.vl-metric-label{font-size:11px;color:var(--sx-text-soft);font-family:var(--sx-mono);text-transform:uppercase;letter-spacing:.04em;}
.vl-metric-val{font-size:18px;font-weight:700;font-family:var(--sx-mono);margin-top:2px;}
.vl-metric--n .vl-metric-val{color:var(--sx-cyan);}
.vl-metric--p .vl-metric-val{color:var(--sx-accent-strong);}
.vl-jump{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;}
.vl-jump span{font-size:12px;color:var(--sx-text-soft);font-family:var(--sx-mono);}
.vl-jump button{padding:5px 10px;font-size:11px;background:var(--sx-bg-elev);border:1px solid var(--sx-border);border-radius:6px;color:var(--sx-text-soft);cursor:pointer;}
.vl-jump button:hover{border-color:var(--sx-cyan);color:var(--sx-cyan);}
.vl-scroll-wrap{position:relative;border:1px solid var(--sx-border);border-radius:var(--sx-radius);overflow:hidden;background:var(--sx-bg-soft);}
.vl-scroll{height:\${VIEW_H}px;overflow-y:auto;}
.vl-scroll::-webkit-scrollbar{width:10px;}
.vl-scroll::-webkit-scrollbar-thumb{background:var(--sx-border-strong);border-radius:5px;}
.vl-inner{position:relative;}
.vl-item{box-sizing:border-box;height:\${ITEM_H}px;display:flex;align-items:center;gap:10px;padding:0 14px;font-size:13px;border-bottom:1px solid var(--sx-border);color:var(--sx-text);}
.vl-item:nth-child(even){background:rgba(255,255,255,.015);}
.vl-item-id{font-family:var(--sx-mono);color:var(--sx-cyan);min-width:96px;}
.vl-item-desc{color:var(--sx-text-soft);font-size:12px;}
.vl-note{font-size:12px;color:var(--sx-text-soft);margin-top:12px;padding:10px 12px;background:var(--sx-bg-soft);border-left:3px solid var(--sx-cyan);border-radius:4px;line-height:1.6;}
.vl-note b{color:var(--sx-text-h);}
.vl-note.warn{border-left-color:var(--sx-red);}
.vl-note.warn b{color:var(--sx-red);}
\`}</style>
      <div className="vl-head">
        <div>
          <h3>虚拟列表实现</h3>
          <p>共 {TOTAL.toLocaleString()} 条数据。虚拟滚动只渲染可视区 ~{visibleCount - BUFFER * 2} 条, 全量渲染则一次性渲染全部。</p>
        </div>
        <div className="vl-toggle">
          <button className={\`naive \${mode === 'naive' ? 'is-on' : ''}\`} onClick={() => setMode('naive')}>全量渲染 (慢)</button>
          <button className={\`virt \${mode === 'virtual' ? 'is-on' : ''}\`} onClick={() => setMode('virtual')}>虚拟滚动 (快)</button>
        </div>
      </div>
      <div className="vl-metrics">
        <div className="vl-metric"><div className="vl-metric-label">总条目</div><div className="vl-metric-val">{TOTAL.toLocaleString()}</div></div>
        <div className="vl-metric vl-metric--n"><div className="vl-metric-label">渲染节点</div><div className="vl-metric-val">{mode === 'virtual' ? end - start : TOTAL.toLocaleString()}</div></div>
        <div className="vl-metric"><div className="vl-metric-label">滚动位置</div><div className="vl-metric-val">{mode === 'virtual' ? Math.round(scrollTop) + 'px' : '—'}</div></div>
        <div className="vl-metric vl-metric--p"><div className="vl-metric-label">可视区间</div><div className="vl-metric-val">{mode === 'virtual' ? \`\${start + 1}~\${end}\` : '1~' + TOTAL}</div></div>
      </div>
      <div className="vl-jump">
        <span>快速跳转</span>
        {[0, 25, 50, 75, 100].map((p) => <button key={p} onClick={() => jumpTo(p)}>{p}%</button>)}
        <span>· 滚动百分比 {scrollPct}%</span>
      </div>
      <div className="vl-scroll-wrap">
        <div className="vl-scroll" ref={scrollRef} onScroll={onScroll}>
          {mode === 'virtual' ? (
            <div className="vl-inner" style={{ height: TOTAL * ITEM_H }}>
              {slice.map((it, i) => (
                <div className="vl-item" key={it.id} style={{ position: 'absolute', top: (start + i) * ITEM_H, width: '100%' }}>
                  <span className="vl-item-id">{it.text}</span><span className="vl-item-desc">{it.desc}</span>
                </div>
              ))}
            </div>
          ) : (
            ITEMS.map((it) => (
              <div className="vl-item" key={it.id}>
                <span className="vl-item-id">{it.text}</span><span className="vl-item-desc">{it.desc}</span>
              </div>
            ))
          )}
        </div>
      </div>
      <p className={\`vl-note \${mode === 'naive' ? 'warn' : ''}\`}>
        <b>虚拟滚动</b>:通过监听 <code>scrollTop</code> 计算可视区间 <code>[start, end]</code>,只渲染这几条,再用 <code>position:absolute + top</code> 定位;外层撑起 <code>TOTAL × ITEM_H</code> 高度以保留原生滚动条。渲染节点 ≈ {end - start},滚动丝滑。<br />
        <b>全量渲染</b>:一次性把 {TOTAL.toLocaleString()} 个 DOM 节点塞进页面,首屏慢、滚动卡顿、内存占用高。切换到此模式可亲身感受性能差距。
      </p>
    </div>
  )
}
`,Tu=`modulepreload`,Eu=function(e,t){return new URL(e,t).href},Du={},Ou=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,import.meta.url).href}r=o(t.map(t=>{if(t=Eu(t,n),t=s(t),t in Du)return;Du[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:Tu,r||(i.as=`script`),i.crossOrigin=``,i.href=t,a&&i.setAttribute(`nonce`,a),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},ku={"json-serialization":{id:`json-serialization`,title:`JSON 序列化策略实战`,tag:`Serialization`,filePath:`src/sandboxes/data-processing/JSONSerializationSandbox.jsx`,instructionMd:su,sourceCode:gu,loadComponent:()=>Ou(()=>import(`./JSONSerializationSandbox-CncCjnRY.js`),[],import.meta.url)},"async-data":{id:`async-data`,title:`异步数据处理实战`,tag:`Async`,filePath:`src/sandboxes/data-processing/AsyncDataSandbox.jsx`,instructionMd:cu,sourceCode:_u,loadComponent:()=>Ou(()=>import(`./AsyncDataSandbox-PJFBjzhR.js`),[],import.meta.url)},"debounce-throttle":{id:`debounce-throttle`,title:`防抖与节流实战`,tag:`Optimization`,filePath:`src/sandboxes/data-processing/DebounceThrottleSandbox.jsx`,instructionMd:lu,sourceCode:vu,loadComponent:()=>Ou(()=>import(`./DebounceThrottleSandbox-CY0S-LBJ.js`),[],import.meta.url)},"state-management":{id:`state-management`,title:`React 状态管理实战`,tag:`State Management`,filePath:`src/sandboxes/react-patterns/StateManagerSandbox.jsx`,instructionMd:uu,sourceCode:yu,loadComponent:()=>Ou(()=>import(`./StateManagerSandbox-L9PzzyIJ.js`),[],import.meta.url)},"form-validation":{id:`form-validation`,title:`表单验证实战`,tag:`Form`,filePath:`src/sandboxes/react-patterns/FormValidationSandbox.jsx`,instructionMd:du,sourceCode:bu,loadComponent:()=>Ou(()=>import(`./FormValidationSandbox-D-XLtZzD.js`),[],import.meta.url)},"use-effect":{id:`use-effect`,title:`useEffect 深度解析`,tag:`Hooks`,filePath:`src/sandboxes/react-patterns/UseEffectSandbox.jsx`,instructionMd:fu,sourceCode:xu,loadComponent:()=>Ou(()=>import(`./UseEffectSandbox-BTbz_F-k.js`),[],import.meta.url)},"context-perf":{id:`context-perf`,title:`Context 性能优化`,tag:`Performance`,filePath:`src/sandboxes/react-patterns/ContextPerfSandbox.jsx`,instructionMd:pu,sourceCode:Su,loadComponent:()=>Ou(()=>import(`./ContextPerfSandbox-CqlB8O65.js`),[],import.meta.url)},"memo-optimization":{id:`memo-optimization`,title:`React.memo 优化实战`,tag:`Memo`,filePath:`src/sandboxes/performance/MemoSandbox.jsx`,instructionMd:mu,sourceCode:Cu,loadComponent:()=>Ou(()=>import(`./MemoSandbox-CqN0LOGh.js`),[],import.meta.url)},"virtual-list":{id:`virtual-list`,title:`虚拟列表实现`,tag:`Virtualization`,filePath:`src/sandboxes/performance/VirtualListSandbox.jsx`,instructionMd:hu,sourceCode:wu,loadComponent:()=>Ou(()=>import(`./VirtualListSandbox-DnA3bCrr.js`),[],import.meta.url)}};function Au(e){return ku[e]||null}var ju=`# DevForge 架构设计文档

> **版本** v1.0.0 · **更新日期** 2026-07-15 · **状态** 正式发布

---

## 目录

1. [项目愿景](#1-项目愿景)
2. [架构哲学：极简单体仓库 (Monorepo / All-in-One)](#2-架构哲学极简单体仓库-monorepo--all-in-one)
3. [仓库目录结构](#3-仓库目录结构)
4. [核心设计模式：物理拦截 vs 知识呈现](#4-核心设计模式物理拦截-vs-知识呈现)
5. [漏斗式路由逻辑](#5-漏斗式路由逻辑)
6. [CI/CD 流水线架构](#6-cicd-流水线架构)
7. [技术栈选型决策](#7-技术栈选型决策)
8. [MVP 里程碑](#8-mvp-里程碑)
9. [非功能性约束](#9-非功能性约束)
10. [进阶特性](#10-进阶特性)

---

## 1. 项目愿景

DevForge 是一个开源的教育与工程化协作平台，致力于在**学生**（仅有单文件 / 算法题背景）和**工业生产**（模块化解耦、CI/CD、高可用）之间架起最短路径的桥梁。

我们认为，从「能写出一个能跑的函数」到「能交付一个可维护的工程」之间，缺少的不是更多教程，而是一个**可以被真实 CI 拦截、被真实规范约束、被真实工具链检验**的练手场。DevForge 就是这个练手场。

### 三大核心原则

| 原则 | 含义 | 对应实现 |
|------|------|----------|
| 接口统一 | 所有靶场、文档、导航共享同一套 CTA 分发协议 | \`handleCtaClick\` 统一入口 |
| 实现下放 | 框架只定义契约，具体实现交由各靶场自行完成 | \`loadComponent\` 动态导入 |
| 渐进式认知 | 学习者按 L1 → L2 → L3 漏斗逐层深入，不被信息淹没 | 三级漏斗导航 |

---

## 2. 架构哲学：极简单体仓库 (Monorepo / All-in-One)

我们拒绝引入外部文档站生成器（Quartz、Docusaurus、VitePress 等）。所有文档都是**纯 Markdown**，所有资产都在**同一个 Git 仓库**里。一个仓库承载三类资产：脚手架源码、CI 拦截配置、规范法典。

### 2.1 为什么选择 All-in-One

| 维度 | 外部文档站（Docusaurus / VitePress 等） | 单体仓库纯 Markdown |
|------|------------------------------------------|----------------------|
| 构建依赖 | 需要 Node 构建 + 框架运行时 + 主题插件 | 零构建，Git 原生预览 |
| 学习成本 | 需学习框架专属语法（frontmatter / MDX / 组件） | 只需会写标准 Markdown |
| 维护负担 | 框架升级、依赖安全、主题适配的长期成本 | 文件即文档，永不过期 |
| CI 集成 | 文档站与代码仓库分离，需额外部署流水线 | 文档与代码同仓库同 PR，CI 统一拦截 |
| 可移植性 | 锁定在特定框架生态 | 任意 Markdown 渲染器即可阅读 |
| 版本追溯 | 文档变更与代码变更可能脱节 | 文档与代码同 commit，原子可追溯 |

### 2.2 设计约束

| 约束 | 说明 | 为什么 |
|------|------|--------|
| 纯标准 Markdown (GFM only) | 只使用 GitHub Flavored Markdown 语法：标题、列表、表格、代码块、引用块。禁止 \`!!! note\`、\`:::tip\` 等扩展语法 | 保证任意平台可读，零渲染依赖 |
| 零构建依赖 | 文档不需要任何编译步骤即可阅读 | 降低贡献门槛，学生只需会写 Markdown |
| 路径即导航 | \`docs/ARCHITECTURE.md\` 这个路径本身就是导航结构 | 物理路径即信息架构，所见即所得 |

---

## 3. 仓库目录结构

\`\`\`
devforge/
├── .github/                     # ── 拦截层（冷酷监工）
│   ├── workflows/
│   │   ├── ci.yml               #   CI 流水线：lint + build
│   │   └── deploy.yml           #   GitHub Pages 部署
│   ├── PULL_REQUEST_TEMPLATE.md #   PR 模板
│   └── ISSUE_TEMPLATE/
│       └── bug_report.md        #   Bug 上报模板
│
├── docs/                        # ── 法典层（耐心导师）
│   ├── ARCHITECTURE.md          #   架构设计文档（本文档）
│   ├── RULES.md                 #   代码规范法典
│   ├── CI-CD-GUIDE.md           #   CI/CD 排查指南
│   ├── ONBOARDING.md            #   新手上路指南
│   └── ai-engineering-standard.md # AI 工程化规范
│
├── src/                         # ── 源码层（待检验代码）
│   ├── components/              #   通用组件
│   ├── config/                  #   配置（漏斗数据、靶场列表、常量）
│   │   ├── const.js
│   │   ├── funnel.js
│   │   └── sandboxes.js
│   ├── hooks/                   #   自定义 Hooks
│   ├── sandboxes/               #   靶场实操组件
│   │   ├── data-processing/
│   │   ├── react-patterns/
│   │   └── performance/
│   ├── services/                #   外部服务封装
│   ├── utils/                   #   工具函数
│   ├── App.jsx                  #   根组件
│   └── main.jsx                 #   入口
│
├── CONTRIBUTING.md              # 贡献指南
├── README.md                    # 项目说明
├── package.json
├── eslint.config.js             # ESLint 扁平配置
└── vite.config.js               # Vite 构建配置
\`\`\`

### 3.1 三类资产的职责边界

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                     用户 / 贡献者                            │
│              (学生 · 初级开发者 · 维护者)                     │
└──────────┬──────────────────┬──────────────────┬────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
  │  .github/      │ │  docs/         │ │  src/          │
  │  拦截层         │ │  法典层         │ │  源码层         │
  │  (冷酷监工)     │ │  (耐心导师)     │ │  (待检验代码)   │
  │                │ │                │ │                │
  │  ci.yml        │ │  ARCHITECTURE  │ │  App.jsx       │
  │  deploy.yml    │ │  RULES         │ │  sandboxes/    │
  │  PR/Issue 模板 │ │  CI-CD-GUIDE   │ │  components/   │
  │                │ │  ONBOARDING    │ │  hooks/        │
  │                │ │  ai-engineering│ │  config/       │
  └───────┬────────┘ └───────┬────────┘ └───────┬────────┘
          │                  │                  │
          │   拦截失败时      │  错误重定向到     │  PR 提交时
          │   指向法典        │  对应规则解释     │  触发拦截
          │                  │                  │
          ▼                  ▼                  ▼
     ┌─────────────────────────────────────────────────┐
     │            ::error → docs/RULES.md#锚点          │
     │            CI 报错信息直接链接到规范法典           │
     └─────────────────────────────────────────────────┘
\`\`\`

### 3.2 为什么这样划分

每一层都有鲜明的「性格」，这种性格决定了它的职责边界：

- **\`.github/\` — 冷酷监工**：它不讲情面。代码不通过 lint，CI 直接标红；PR 缺少自检清单，模板会提醒你。它是规则的物理执行者，不接受「我觉得没问题」。
- **\`docs/\` — 耐心导师**：它不指责，只解释。当 CI 拦截了你的代码，错误信息会把你导向这里，告诉你「为什么这条规则存在」「正确写法是什么」「错误长什么样」。
- **\`src/\` — 待检验代码**：它是最诚实的部分。靶场里故意埋了 bug，等你来修；修复后必须通过 CI 的检验才算合格。代码本身不解释自己，解释工作交给法典层。

### 3.3 文档的导航结构

文档之间存在一条明确的阅读动线，对应贡献者从「认识项目」到「参与贡献」的完整路径：

\`\`\`
README.md                项目入口，回答「这是什么 / 为什么存在」
   │
   ▼
ONBOARDING.md            第一次参与：环境准备 → 30 秒启动 → 第一个 PR
   │
   ▼
ARCHITECTURE.md          理解全局：三类资产 · 漏斗路由 · CI 流水线（本文档）
   │
   ▼
RULES.md                 代码规范：每条 ESLint 规则的正/误对照
   │
   ▼
CI-CD-GUIDE.md           CI 爆红时的 5 分钟修复手册
   │
   ▼
CONTRIBUTING.md          贡献流程：提交规范 · PR 流程 · 行为准则
\`\`\`

---

## 4. 核心设计模式：物理拦截 vs 知识呈现

DevForge 的核心设计理念可以用一句话概括：**用 CI 物理拦截错误，用文档耐心解释原因**。这两者不是割裂的，而是通过「错误重定向」机制紧密耦合。

| 维度 | 物理拦截 (Physical Interception) | 知识呈现 (Knowledge Presentation) |
|------|----------------------------------|----------------------------------|
| 发生位置 | \`.github/workflows/ci.yml\` | \`docs/RULES.md\` |
| 触发时机 | PR 提交 / push 到 main | 用户主动点击阅读 |
| 交互方式 | 强制阻断，CI 标红，PR 无法合并 | 渐进展示，按需深入 |
| 语气 | 冷酷、不可协商 | 耐心、解释原因 |
| 输出形式 | \`::error\` 注解 + 退出码 1 | Markdown 表格 + 正/误代码对照 |
| 用户体验 | 「你的代码有问题，不能合并」 | 「这是为什么，正确写法在这里」 |

### 错误重定向机制

当 CI 拦截到代码问题时，错误信息不是冷冰冰的报错堆栈，而是**结构化输出**，直接把用户导向 \`docs/RULES.md\` 中对应的规则解释。这样用户不需要在报错和文档之间来回跳转搜索。

\`\`\`yaml
# .github/workflows/ci.yml 中的结构化错误输出
- name: Run ESLint
  run: |
    npm run lint || {
      echo "::error file=docs/RULES.md,title=ESLint 规范未通过::\\
        代码未通过 ESLint 检查。请阅读 docs/RULES.md 查看每条规则的正/误对照。"
      echo "::error title=排查指南::\\
        CI 爆红了？查看 docs/CI-CD-GUIDE.md 获取 5 分钟修复手册。"
      exit 1
    }
\`\`\`

这段配置做了三件事：

1. 运行 \`npm run lint\`，如果失败则进入错误分支。
2. 输出 \`::error\` 注解，在 GitHub PR 的 Files changed 视图直接高亮提示，并附带 \`docs/RULES.md\` 的链接。
3. 退出码为 1，阻断 PR 合并。

---

## 5. 漏斗式路由逻辑

DevForge 采用**三级漏斗式导航**，将海量内容按认知深度逐层收敛，避免学习者在入口处就被信息淹没。

### 三层漏斗结构

\`\`\`
                    ┌─────────────────────────┐
                    │      L1  一级大类        │
                    │  软件开发 · 网络安全 ...  │
                    └────────┬────────────────┘
                             │ 选中后展开
                    ┌────────▼────────────────┐
                    │      L2  子方向          │
                    │  前端 · 数据处理 · 性能  │
                    └────────┬────────────────┘
                             │ 选中后展开
                    ┌────────▼────────────────┐
                    │      L3  落地靶场/文档   │
                    │  sandbox · doc · external│
                    └─────────────────────────┘
\`\`\`

### URL Hash 路由

每一层的选择状态都同步到 URL hash，实现可分享、可后退的导航体验：

\`\`\`
https://devforge.github.io/#l1=software&l2=frontend&l3=state-management
\`\`\`

对应的 hash 参数：

| 参数 | 含义 | 示例值 |
|------|------|--------|
| \`l1\` | 一级大类 ID | \`software\` |
| \`l2\` | 子方向 ID | \`frontend\` |
| \`l3\` | 落地节点 ID | \`state-management\` |
| \`sandbox\` | 当前打开的靶场 ID | \`state-management\` |
| \`doc\` | 当前打开的文档 ID | \`architecture\` |

路由读写由 \`writeHash()\` / \`readHash()\` 两个纯函数负责，状态变化时通过 \`useEffect\` 自动同步。

### CTA 分发

L3 节点落地时，由 \`handleCtaClick\` 统一分发，根据 \`cta.kind\` 决定行为：

| \`cta.kind\` | 行为 | 示例 |
|------------|------|------|
| \`sandbox\` | 打开 SandboxViewer，异步加载靶场组件 | \`kind: 'sandbox', sandboxId: 'state-management'\` |
| \`doc\` | 打开 MarkdownViewer，渲染本地 Markdown | \`kind: 'doc', docId: 'architecture'\` |
| \`external\` | 走 SafeLink 安全跳转外部链接 | \`kind: 'external', href: 'https://...'\` |

---

## 6. CI/CD 流水线架构

### 拦截矩阵

CI 流水线在两个时机拦截代码质量，覆盖从提交到部署的全链路：

| 拦截点 | 触发条件 | 执行内容 | 失败行为 |
|--------|----------|----------|----------|
| CI Lint | push 到 main / PR 到 main | \`npm ci\` → \`npm run lint\` | 标红 PR，输出 \`::error\` 指向 RULES.md |
| CI Build | push 到 main / PR 到 main | \`npm run build\` | 标红 PR，阻断合并 |
| Deploy | push 到 main | \`npm run build\` → 上传 Pages 产物 → 部署 | 部署失败，页面不更新 |

### 流水线流程图

\`\`\`
push / PR
    │
    ▼
┌──────────┐     失败     ┌──────────────────────┐
│ npm ci   │─────────────▶│ ::error → CI-CD-GUIDE │
└────┬─────┘              └──────────────────────┘
     │ 通过
     ▼
┌──────────┐     失败     ┌──────────────────────┐
│ lint     │─────────────▶│ ::error → RULES.md    │
└────┬─────┘              └──────────────────────┘
     │ 通过
     ▼
┌──────────┐     失败     ┌──────────────────────┐
│ build    │─────────────▶│ ::error → CI-CD-GUIDE │
└────┬─────┘              └──────────────────────┘
     │ 通过 (仅 main 分支)
     ▼
┌──────────────────────────┐
│ 上传 Pages 产物 → 部署    │
└──────────────────────────┘
\`\`\`

### 错误重定向的结构化输出

CI 在每个失败节点输出结构化注解，将报错信息直接关联到对应文档：

\`\`\`yaml
# Lint 失败时的结构化输出
- name: Run ESLint
  run: |
    if ! npm run lint; then
      echo "::error file=docs/RULES.md,title=ESLint 检查未通过::\\
        请对照 docs/RULES.md 逐条修复，每条规则附有正/误代码对照。"
      echo "::error title=排查指南::\\
        完整排查步骤见 docs/CI-CD-GUIDE.md#2-eslint-报错排查"
      exit 1
    fi

# Build 失败时的结构化输出
- name: Run Build
  run: |
    if ! npm run build; then
      echo "::error title=Vite 构建失败::\\
        构建失败排查见 docs/CI-CD-GUIDE.md#3-build-失败排查"
      exit 1
    fi
\`\`\`

---

## 7. 技术栈选型决策

每一项技术选型都有明确的「为什么选它」和「为什么不选别的」。

| 技术 | 版本 | 选型理由 |
|------|------|----------|
| React | 19 | 当前稳定主线版本，支持 Suspense / lazy 实现靶场异步加载，Hooks 生态成熟 |
| Vite | 8 | 零配置极速启动，原生 ESM，\`?raw\` 后缀安全加载 Markdown 文件，无需额外插件 |
| ESLint | 10 | 扁平配置 (Flat Config)，与 React Hooks 插件深度集成，CI 拦截的核心执行器 |
| GitHub Actions | - | 与 GitHub 仓库原生集成，\`::error\` 注解直接在 PR 视图高亮，零额外成本 |
| 纯 Markdown | GFM | 零构建依赖，任意平台可读，贡献者只需会写标准 Markdown |
| npm | - | Node.js 原生包管理器，\`package-lock.json\` 保证 CI 与本地环境一致 |

---

## 8. MVP 里程碑

项目按 5 个阶段渐进交付，每个阶段都有明确的可验证产出：

| 阶段 | 名称 | 目标 | 可验证产出 |
|------|------|------|------------|
| Phase 1 | 脚手架奠基 | 搭建 Vite + React + ESLint 工程 | \`npm run dev\` 可启动，\`npm run lint\` 通过 |
| Phase 2 | 漏斗导航 | 实现三级漏斗 + URL hash 路由 | 选中状态可分享、可后退 |
| Phase 3 | 靶场实况 | 接入 9 个靶场 + 错误边界 + 代码编辑器 | 靶场可打开、可修复、可标记完成 |
| Phase 4 | CI 拦截 | CI 流水线 + 结构化错误输出 + Pages 部署 | PR 不通过 lint 则标红并指向 RULES.md |
| Phase 5 | 协作闭环 | GitHub PR 一键提交 + 进度追踪 + 命令面板 | 靶场修复后可直接提交 PR |

---

## 9. 非功能性约束

以下约束是硬性的，不可妥协：

| 约束 | 要求 | 原因 |
|------|------|------|
| Node.js 版本 | v22 LTS | 统一运行时，CI 与本地一致 |
| 锁文件 | \`package-lock.json\` 必须提交 | 保证依赖版本可复现，CI 使用 \`npm ci\` |
| 主分支保护 | \`main\` 分支禁止直接 push | 所有变更必须通过 PR + CI 检查 |
| 提交规范 | Conventional Commits | \`feat:\` / \`fix:\` / \`refactor:\` / \`docs:\` / \`chore:\` / \`test:\` |
| 文档格式 | GFM only | 禁止 \`!!! note\` / \`:::tip\` 等扩展语法，保证零渲染依赖 |
| CI 超时 | 单 job 不超过 10 分钟 | 防止卡死任务占用 runner 资源 |

---

## 10. 进阶特性

在 MVP 之上，DevForge 提供以下进阶特性来提升工程体验：

### 命令面板 (Cmd+K)

按 \`⌘K\`（macOS）或 \`Ctrl+K\`（Windows/Linux）唤起全局命令面板，支持：

- 搜索并跳转到任意靶场
- 搜索并打开任意文档
- 快速切换漏斗导航层级

实现位于 \`src/hooks/useKeyboard.js\`，通过全局 \`keydown\` 事件监听 \`mod+k\` 组合键。

### 进度追踪 (localStorage)

用户的靶场完成状态持久化在浏览器本地，无需登录：

- 存储键：\`devforge_progress\`
- 数据结构：\`{ [sandboxId]: 'Todo' | 'Solved' | 'Skipped' }\`
- 读写函数：\`loadProgress()\` / \`saveProgress()\`

### GitHub PR 一键提交

在靶场中修复代码后，无需切换到 GitHub 网页端，直接在应用内提交 PR：

1. 用户输入 GitHub Personal Access Token（仅存于 \`localStorage\`，不上传服务端）
2. 通过 GitHub Contents API 获取目标文件 SHA
3. 创建新分支 \`sandbox-fix/{id}-{timestamp}\`
4. 更新文件内容到新分支
5. 创建 PR，自动填充标题和描述

整个流程封装在 \`handleCommitWithToken\` 中，所有 API 调用都在浏览器端完成，不经过任何中间服务器。

---

> 本文档遵循 GFM 规范，可在任意 Markdown 渲染器中阅读。如需修改，请提交 PR 并确保 CI 通过。
`,Mu=`# DevForge 代码规范法典

> **版本** v1.0.0 · **更新日期** 2026-07-15 · **状态** 正式发布

CI 拦截的每一条规则都在这里。每条规则附有正/误代码对照，请逐条阅读。

---

## 目录

1. [为什么需要规范](#1-为什么需要规范)
2. [ESLint 规则逐条解释](#2-eslint-规则逐条解释)
3. [提交规范](#3-提交规范)
4. [命名规范](#4-命名规范)
5. [目录规范](#5-目录规范)
6. [文档规范](#6-文档规范)

---

## 1. 为什么需要规范

这些规范不是「建议」，不是「最佳实践参考」，而是**被 CI 物理拦截的强制约束**。

当你在本地写完代码、提交 PR 后，GitHub Actions 会运行 \`npm run lint\`。如果代码违反了下述任何一条规则，CI 会标红你的 PR，阻断合并。错误信息会直接指向本文档的对应章节，告诉你「为什么这条规则存在」「正确写法是什么」。

> 规范的目的不是为难你，而是帮你提前消灭那些在真实工程项目中会导致线上事故的坏习惯。在 DevForge 学到的每一条规则，都对应着工业界的真实血泪教训。

---

## 2. ESLint 规则逐条解释

以下规则在 \`eslint.config.js\` 中配置，由 \`npm run lint\` 强制执行。

### no-unused-vars

| 项目 | 内容 |
|------|------|
| 级别 | \`error\`（阻断合并） |
| 捕获什么 | 声明了但从未使用的变量、函数参数、导入语句 |
| 为什么 | 死代码是维护负担的根源。未使用的变量往往意味着逻辑遗漏或重构残留 |

**正确写法：**

\`\`\`javascript
import { useState, useEffect } from 'react'

function MyComponent({ title }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    document.title = title
  }, [title])
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
\`\`\`

**错误写法：**

\`\`\`javascript
import { useState, useEffect, useRef } from 'react'  // useRef 未使用 → error

function MyComponent({ title, subtitle }) {           // subtitle 未使用 → error
  const [count, setCount] = useState(0)
  const unused = 42                                    // 未使用 → error
  useEffect(() => {
    document.title = title
  }, [title])
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
\`\`\`

> 提示：如果函数参数确实需要保留位置但暂不使用，可用下划线前缀豁免：\`function handler(_event) {}\`（配置了 \`argsIgnorePattern: '^_'\`）。

---

### no-console

| 项目 | 内容 |
|------|------|
| 级别 | \`warn\`（不阻断合并，但会在 CI 输出警告） |
| 捕获什么 | 代码中的 \`console.log\` / \`console.warn\` / \`console.error\` 调用 |
| 为什么 | 生产环境不应残留调试日志。\`console.log\` 会暴露内部数据、污染控制台、影响性能 |

**正确写法：**

\`\`\`javascript
function fetchData() {
  return fetch('/api/data').then((res) => res.json())
}

// 如果确实需要日志，使用专门的 logger 服务或条件编译
\`\`\`

**错误写法：**

\`\`\`javascript
function fetchData() {
  console.log('开始请求')                    // warn
  return fetch('/api/data').then((res) => {
    console.log('响应:', res)                // warn
    return res.json()
  })
}
\`\`\`

> 提示：开发阶段可用 \`console.log\` 临时调试，但提交前务必删除。CI 不会因为 \`warn\` 阻断合并，但维护者 review 时会要求清理。

---

### react-hooks/rules-of-hooks

| 项目 | 内容 |
|------|------|
| 级别 | \`error\`（阻断合并） |
| 捕获什么 | 在条件语句、循环、嵌套函数中调用 Hook；在非组件函数中调用 Hook |
| 为什么 | React 依赖 Hook 的调用顺序来关联状态。条件调用会破坏顺序一致性，导致状态错乱和崩溃 |

**正确写法：**

\`\`\`javascript
function UserProfile({ userId }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!userId) return            // 在 Effect 内部做条件判断，而不是条件调用 Hook
    fetchUser(userId).then(setUser)
  }, [userId])

  if (!userId) return <p>请选择用户</p>
  if (!user) return <p>加载中...</p>
  return <div>{user.name}</div>
}
\`\`\`

**错误写法：**

\`\`\`javascript
function UserProfile({ userId }) {
  if (userId) {                                     // 条件调用 Hook → error
    const [user, setUser] = useState(null)
  }

  for (let i = 0; i < 3; i++) {                     // 循环中调用 Hook → error
    useEffect(() => {}, [])
  }

  const handler = () => {
    const [state, setState] = useState(0)            // 嵌套函数中调用 Hook → error
  }

  return <div />
}
\`\`\`

---

### react-hooks/exhaustive-deps

| 项目 | 内容 |
|------|------|
| 级别 | \`error\`（阻断合并） |
| 捕获什么 | \`useEffect\` / \`useCallback\` / \`useMemo\` 的依赖数组遗漏了函数体内引用的外部变量 |
| 为什么 | 依赖数组遗漏会导致闭包捕获旧值，引发竞态条件、内存泄漏、状态不更新等难以排查的 bug |

**正确写法：**

\`\`\`javascript
function SearchResults({ query }) {
  const [results, setResults] = useState([])

  useEffect(() => {
    if (!query) return
    let cancelled = false
    fetchResults(query).then((data) => {
      if (!cancelled) setResults(data)
    })
    return () => { cancelled = true }
  }, [query])   // query 在 Effect 内被引用，必须出现在依赖数组中
}
\`\`\`

**错误写法：**

\`\`\`javascript
function SearchResults({ query }) {
  const [results, setResults] = useState([])

  useEffect(() => {
    if (!query) return
    fetchResults(query).then(setResults)
  }, [])        // 依赖数组为空，但函数体引用了 query → error
}
\`\`\`

> 提示：如果你确信某个依赖不需要列入（例如它是一个稳定引用），在上方注释 \`// eslint-disable-next-line react-hooks/exhaustive-deps\` 并说明原因。但请谨慎使用，99% 的情况下你应该把它加进去。

---

### react-refresh/only-export-components

| 项目 | 内容 |
|------|------|
| 级别 | \`warn\`（不阻断合并，但会在 CI 输出警告） |
| 捕获什么 | 一个文件中既导出 React 组件，又导出非组件值（常量、函数、类型） |
| 为什么 | React Fast Refresh (HMR) 要求每个文件只导出组件。混合导出会导致热更新时状态丢失或报错 |

**正确写法：**

\`\`\`javascript
// constants.js — 常量单独放一个文件
export const MAX_ITEMS = 100
export const API_BASE = '/api/v1'

// UserCard.jsx — 只导出组件
export function UserCard({ name }) {
  return <div>{name}</div>
}
\`\`\`

**错误写法：**

\`\`\`javascript
// UserCard.jsx — 既导出组件又导出常量 → warn
export const MAX_ITEMS = 100

export function UserCard({ name }) {
  return <div>{name}</div>
}
\`\`\`

> 提示：配置了 \`allowConstantExport: true\`，因此只导出常量（不导出组件）的文件不会报警。但「组件 + 常量混导」仍会触发警告。

---

### no-debugger

| 项目 | 内容 |
|------|------|
| 级别 | \`error\`（阻断合并） |
| 捕获什么 | 代码中的 \`debugger\` 语句 |
| 为什么 | \`debugger\` 会让浏览器暂停执行，如果残留到生产环境会卡住用户页面 |

**正确写法：**

\`\`\`javascript
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0)
}
\`\`\`

**错误写法：**

\`\`\`javascript
function calculateTotal(items) {
  debugger                                      // → error
  return items.reduce((sum, item) => sum + item.price, 0)
}
\`\`\`

---

### eqeqeq

| 项目 | 内容 |
|------|------|
| 级别 | \`error\`（阻断合并） |
| 捕获什么 | 使用 \`==\` 或 \`!=\` 进行松散相等比较，而非 \`===\` 或 \`!==\` 严格比较 |
| 为什么 | \`==\` 会触发隐式类型转换，导致 \`'' == 0\`、\`null == undefined\` 等反直觉的结果，是无数 bug 的根源 |

**正确写法：**

\`\`\`javascript
function isValid(value) {
  if (value === null || value === undefined) return false
  if (value === '') return false
  return true
}

// 判断 null/undefined 时可用宽松比较，但建议显式
if (value === null || value === undefined) { /* ... */ }
\`\`\`

**错误写法：**

\`\`\`javascript
function isValid(value) {
  if (value == null) return false       // 隐式转换 → error
  if (value == '') return false         // 隐式转换 → error
  if (status == 200) { /* ... */ }      // 应使用 === → error
  return true
}
\`\`\`

> 提示：唯一可接受的 \`==\` 场景是 \`value == null\`（同时判断 \`null\` 和 \`undefined\`），但本项目一律要求 \`===\`，保持一致。

---

## 3. 提交规范

所有 commit message 必须遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。CI 会检查 commit 格式。

### 提交类型

| 类型 | 含义 | 何时使用 | 示例 |
|------|------|----------|------|
| \`feat:\` | 新功能 | 新增用户可感知的能力 | \`feat: 新增虚拟列表靶场\` |
| \`fix:\` | 修复 | 修复已有 bug | \`fix: 修复 Context 重渲染问题\` |
| \`refactor:\` | 重构 | 不改变外部行为的代码调整 | \`refactor: 抽取公共防抖逻辑到 utils\` |
| \`docs:\` | 文档 | 仅修改文档 | \`docs: 补充 ESLint 规则说明\` |
| \`chore:\` | 杂务 | 构建、配置、依赖等非功能变更 | \`chore: 升级 Vite 到 8.1.1\` |
| \`test:\` | 测试 | 新增或修改测试 | \`test: 添加 JSON 序列化边界用例\` |

### 格式要求

\`\`\`
<type>: <简短描述>

<可选的详细说明>
\`\`\`

- 描述部分使用中文，简洁明确，不超过 50 字
- 不要以句号结尾
- 使用祈使句（「新增」而非「新增了」）

---

## 4. 命名规范

一致的命名是可读性的基础。以下规则覆盖文件、变量、常量、组件四个维度。

### 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| React 组件文件 | PascalCase | \`UserCard.jsx\`、\`SandboxViewer.jsx\` |
| 工具函数文件 | camelCase | \`helper.js\`、\`linkUtils.js\` |
| 配置文件 | camelCase | \`funnel.js\`、\`sandboxes.js\` |
| 常量文件 | camelCase | \`const.js\` |
| Markdown 文档 | 全大写或 kebab-case | \`ARCHITECTURE.md\`、\`ai-engineering-standard.md\` |

### 变量命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 普通变量 | camelCase | \`userName\`、\`isLoading\` |
| 布尔变量 | camelCase + is/has/should 前缀 | \`isVisible\`、\`hasError\`、\`shouldRender\` |
| 函数 | camelCase | \`handleSubmit\`、\`fetchUserData\` |

### 常量命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 全局常量 | UPPER_SNAKE_CASE | \`MAX_ITEMS\`、\`API_BASE_URL\` |
| 枚举值 | UPPER_SNAKE_CASE | \`STATUS_TODO\`、\`STATUS_SOLVED\` |

### 组件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| React 组件 | PascalCase | \`function UserCard() {}\`、\`const App = () => {}\` |
| 组件 props | camelCase | \`{ userName, onSubmit }\` |
| 自定义 Hook | use 前缀 + camelCase | \`useLocalStorage\`、\`useProgress\` |

---

## 5. 目录规范

每个目录有明确的职责边界，放错位置会导致 CI 无法正确扫描或组件无法被动态导入。

| 目录 | 放什么 | 不放什么 | 示例 |
|------|--------|----------|------|
| \`src/components/\` | 通用 UI 组件（跨靶场复用） | 靶场专属组件、业务逻辑 | \`MarkdownViewer.jsx\`、\`Toast.jsx\` |
| \`src/config/\` | 配置数据和常量 | 含业务逻辑的函数 | \`funnel.js\`、\`sandboxes.js\`、\`const.js\` |
| \`src/sandboxes/\` | 靶场实操组件 + 任务说明 | 通用组件、非靶场代码 | \`data-processing/JSONSerializationSandbox.jsx\` |
| \`src/services/\` | 外部服务封装（API 调用等） | UI 组件、纯数据 | \`githubService.js\` |
| \`src/hooks/\` | 自定义 React Hooks | 非 Hook 函数 | \`useLocalStorage.js\`、\`useKeyboard.js\` |
| \`src/utils/\` | 纯工具函数（无副作用） | 含状态或副作用的逻辑 | \`helper.js\`、\`link.js\` |
| \`docs/\` | 纯 Markdown 文档 | 代码文件、图片资源 | \`ARCHITECTURE.md\`、\`RULES.md\` |

---

## 6. 文档规范

DevForge 的文档遵循严格的格式约束，确保零渲染依赖、任意平台可读。

### 只使用 GFM 语法

允许使用的 Markdown 语法：

- 标题（\`#\` ~ \`######\`）
- 有序/无序列表
- 表格（\`| 列 | 列 |\`）
- 代码块（\`\`\` 包裹，标注语言）
- 引用块（\`>\`）
- 行内代码（\`\` \`code\` \`\`）
- 链接和图片
- 粗体（\`**bold**\`）和斜体（\`*italic*\`）
- 删除线（\`~~text~~\`）
- 任务列表（\`- [ ]\` / \`- [x]\`）

### 禁止使用的扩展语法

| 禁止语法 | 来源 | 替代方案 |
|----------|------|----------|
| \`!!! note\` | mkdocs / Python-Markdown | 用 \`>\` 引用块代替 |
| \`:::tip\` / \`:::warning\` | Docusaurus / VuePress | 用 \`>\` 引用块代替 |
| \`{% include %}\` | Jekyll / Liquid | 直接内联内容 |
| frontmatter (\`---\`) | Hugo / Jekyll | 不需要，文档元信息写在正文第一行引用块 |
| Mermaid 图表 (\` \`\`\`mermaid \`) | 各种文档站 | 用 ASCII art 代码块代替 |

### 路径即导航

文档之间使用相对路径引用，路径本身即代表导航结构：

\`\`\`markdown
详见 [架构设计文档](./ARCHITECTURE.md) 和 [代码规范法典](./RULES.md)。
\`\`\`

不要使用锚点别名或短链接，保持路径的直观可读性。

---

> 本文档是 CI 拦截规则的唯一权威解释。如果你被 CI 拦截了，来这里找答案。
`,Nu=`# DevForge CI/CD 排查指南

> **版本** v1.0.0 · **更新日期** 2026-07-15 · **状态** 正式发布

CI 爆红了？别慌。这份指南帮你在 5 分钟内定位问题并修复。

---

## 目录

1. [CI 流水线概览](#1-ci-流水线概览)
2. [ESLint 报错排查](#2-eslint-报错排查)
3. [Build 失败排查](#3-build-失败排查)
4. [常见问题 FAQ](#4-常见问题-faq)
5. [本地预检命令](#5-本地预检命令)

---

## 1. CI 流水线概览

当你提交 PR 或 push 到 \`main\` 分支时，GitHub Actions 会自动运行 CI 流水线。流水线依次执行以下步骤：

\`\`\`
checkout  →  setup Node 22  →  npm ci  →  npm run lint  →  npm run build
\`\`\`

| 步骤 | 命令 | 作用 | 失败后果 |
|------|------|------|----------|
| 依赖安装 | \`npm ci\` | 根据 \`package-lock.json\` 安装精确版本的依赖 | 流水线中断，通常是锁文件不匹配 |
| 代码检查 | \`npm run lint\` | 运行 ESLint，检查代码规范 | PR 标红，输出 \`::error\` 指向 RULES.md |
| 构建验证 | \`npm run build\` | 运行 Vite 构建，验证代码可打包 | PR 标红，输出 \`::error\` 指向本指南 |

任何一个步骤失败，整个流水线标记为失败，PR 无法合并。你需要修复所有红色步骤后重新 push。

---

## 2. ESLint 报错排查

这是最常见的 CI 失败原因。CI 会在失败时输出 \`::error\` 注解，直接指向 \`docs/RULES.md\`。下表列出了常见报错及其修复方法。

### 常见错误一览

| 错误信息 | 规则 | 原因 | 修复方法 | 规范详情 |
|----------|------|------|----------|----------|
| \`'xxx' is defined but never used\` | no-unused-vars | 声明了变量/导入但未使用 | 删除未使用的声明，或加 \`_\` 前缀 | [RULES.md#no-unused-vars](./RULES.md#no-unused-vars) |
| \`Unexpected console statement\` | no-console | 代码中残留 \`console.log\` | 删除调试日志 | [RULES.md#no-console](./RULES.md#no-console) |
| \`React Hook is called conditionally\` | rules-of-hooks | 在 if/for 中调用 Hook | 将 Hook 移到条件语句之前 | [RULES.md#react-hooksrules-of-hooks](./RULES.md#react-hooksrules-of-hooks) |
| \`React Hook has a missing dependency\` | exhaustive-deps | 依赖数组遗漏了引用的变量 | 将遗漏的变量加入依赖数组 | [RULES.md#react-hooksexhaustive-deps](./RULES.md#react-hooksexhaustive-deps) |
| \`Fast refresh only works when a file only exports components\` | only-export-components | 文件混合导出组件和常量 | 将常量拆到单独文件 | [RULES.md#react-refreshonly-export-components](./RULES.md#react-refreshonly-export-components) |
| \`Unexpected 'debugger' statement\` | no-debugger | 代码中残留 \`debugger\` | 删除 \`debugger\` 语句 | [RULES.md#no-debugger](./RULES.md#no-debugger) |
| \`Expected '===' and instead saw '=='\` | eqeqeq | 使用了 \`==\` 而非 \`===\` | 将 \`==\` 改为 \`===\`，\`!=\` 改为 \`!==\` | [RULES.md#eqeqeq](./RULES.md#eqeqeq) |

### 排查步骤

1. **打开 PR 的 Checks 标签页**，点击失败的 \`lint-and-build\` job。
2. **展开 "Run ESLint" 步骤**，查看具体的报错行号和规则名。
3. **点击 CI 输出的 \`::error\` 链接**，跳转到 \`docs/RULES.md\` 对应章节。
4. **对照正/误代码示例**，修改你的代码。
5. **本地运行 \`npm run lint\`** 验证修复，确认无报错后再 push。

### 本地复现 ESLint 检查

\`\`\`bash
# 检查全部文件
npm run lint

# 检查单个文件
npx eslint src/sandboxes/react-patterns/StateManagerSandbox.jsx

# 查看详细规则说明
npx eslint --print-config src/App.jsx
\`\`\`

---

## 3. Build 失败排查

Build 失败意味着代码虽然通过了 lint，但 Vite 无法将其打包。常见原因分为三类。

### 导入错误 (Import Errors)

| 错误信息 | 原因 | 修复方法 |
|----------|------|----------|
| \`Failed to resolve import "xxx"\` | 导入了不存在的模块 | 检查路径拼写，确认文件存在 |
| \`Cannot find module './xxx'\` | 相对路径错误 | 确认文件层级关系，使用正确的 \`./\` 或 \`../\` |
| \`The requested module does not provide an export named 'xxx'\` | 导入了不存在的命名导出 | 检查目标文件的 \`export\` 语句 |

\`\`\`javascript
// 错误：路径拼写错误
import { foo } from './../../../componets/Header.jsx'   // componets → components

// 正确
import { foo } from '../../components/Header.jsx'
\`\`\`

### 语法错误 (Syntax Errors)

| 错误信息 | 原因 | 修复方法 |
|----------|------|----------|
| \`Unexpected token\` | JSX 语法错误，如标签未闭合 | 检查 JSX 标签是否成对闭合 |
| \`Cannot use import statement outside a module\` | 在非模块文件中使用 import | 确保文件扩展名为 \`.js\` / \`.jsx\`，且 \`package.json\` 设置了 \`"type": "module"\` |
| \`Unterminated string literal\` | 字符串引号未闭合 | 检查引号配对 |

### 依赖缺失 (Missing Dependencies)

| 错误信息 | 原因 | 修复方法 |
|----------|------|----------|
| \`Module not found: Can't resolve 'xxx'\` | 使用了未安装的 npm 包 | 运行 \`npm install xxx\`，并确认已写入 \`package.json\` |
| \`Cannot find package 'xxx'\` | 包名拼写错误 | 检查 npm 包名，访问 npmjs.com 确认 |

\`\`\`bash
# 如果 CI 报依赖缺失但本地正常，通常是 package.json 漏了依赖
# 确认本地 node_modules 中有该包后：
npm install xxx --save

# 然后提交 package.json 和 package-lock.json
\`\`\`

### 排查步骤

1. **打开 PR 的 Checks 标签页**，点击失败的 \`lint-and-build\` job。
2. **展开 "Run Build" 步骤**，查看报错的文件路径和行号。
3. **根据错误类型对照上表**，定位问题。
4. **本地运行 \`npm run build\`** 复现并修复。
5. **确认本地 build 通过后再 push**。

---

## 4. 常见问题 FAQ

### Q: CI 爆红了怎么办？

**A:** 按以下顺序排查：

1. 打开 PR 的 Checks 标签页，找到失败的步骤。
2. 如果是 "Run ESLint" 失败 → 跳转到 [第 2 节](#2-eslint-报错排查)。
3. 如果是 "Run Build" 失败 → 跳转到 [第 3 节](#3-build-失败排查)。
4. 如果是 "Install dependencies" 失败 → 通常是 \`package-lock.json\` 与 \`package.json\` 不一致，运行 \`npm install\` 后重新提交锁文件。
5. 修复后在本地运行 \`npm run lint && npm run build\` 确认通过，再 push。

### Q: 本地怎么复现 CI 的检查？

**A:** 运行以下两条命令，它们和 CI 执行的完全一致：

\`\`\`bash
npm ci              # 与 CI 一致的依赖安装方式（需要 package-lock.json）
npm run lint        # ESLint 检查
npm run build       # Vite 构建
\`\`\`

如果你没有 \`package-lock.json\` 或想更新依赖：

\`\`\`bash
npm install         # 生成/更新 package-lock.json
\`\`\`

建议在每次提交前都运行一次 \`npm run lint && npm run build\`，避免 CI 来回报错。

### Q: 如何跳过 CI？

**A:** 不能，也不应该。

DevForge 的设计理念就是**物理拦截**——CI 是代码质量的最后一道防线，没有后门可以绕过。如果你觉得某条规则过于严格，正确的做法是：

1. 在 PR 中说明你的理由，附上具体场景。
2. 与维护者讨论是否调整规则配置（修改 \`eslint.config.js\`）。
3. 如果达成共识，规则变更本身也是一个 PR，需要通过 CI。

不要尝试用 \`// eslint-disable\` 大面积绕过规则。少量、有注释的豁免是可以接受的，但滥用会被 review 拒绝。

### Q: 为什么 CI 显示的报错和本地不一样？

**A:** 最常见的原因是依赖版本不一致。CI 使用 \`npm ci\`，严格按 \`package-lock.json\` 安装；本地如果用了 \`npm install\`，可能装到了不同的小版本。解决办法：

\`\`\`bash
rm -rf node_modules package-lock.json
npm install
npm run lint
\`\`\`

### Q: CI 通过了但 review 被拒绝，为什么？

**A:** CI 只检查「机器能检测的问题」（语法、规范、构建）。代码设计、可读性、架构合理性需要人工 review。CI 通过不等于可以合并，请尊重 review 意见。

---

## 5. 本地预检命令

在提交代码之前，请运行以下命令，确保本地和 CI 结果一致。这是避免 PR 反复标红的最有效方法。

### 预检清单

| 命令 | 作用 | 何时运行 |
|------|------|----------|
| \`npm run lint\` | ESLint 代码规范检查 | 每次提交前 |
| \`npm run build\` | Vite 生产构建验证 | 每次提交前 |
| \`npm run dev\` | 启动开发服务器，手动验证功能 | 修改 UI 逻辑后 |
| \`npm run preview\` | 预览构建产物，验证生产环境行为 | 发布前 |

### 一键预检

\`\`\`bash
# 检查 + 构建一条命令搞定
npm run lint && npm run build
\`\`\`

如果这条命令在你的本地通过了，CI 几乎不可能失败（除非依赖版本差异，参见 FAQ）。

### git pre-commit hook（可选）

如果你希望在 \`git commit\` 时自动运行 lint，可以创建 pre-commit hook：

\`\`\`bash
# .git/hooks/pre-commit
#!/bin/sh
npm run lint || exit 1
\`\`\`

\`\`\`bash
chmod +x .git/hooks/pre-commit
\`\`\`

这样每次 commit 时都会自动检查，不合格的代码无法提交。

---

> 还在报错？把 CI 的完整输出贴到 GitHub Issue 里，维护者会帮你排查。
`,Pu=`# DevForge 新手上路指南

> **版本** v1.0.0 · **更新日期** 2026-07-15 · **状态** 正式发布

欢迎来到 DevForge。这份指南帮你在 5 分钟内跑通项目，并完成你的第一个 PR。

---

## 目录

1. [你是谁](#1-你是谁)
2. [环境准备](#2-环境准备)
3. [30 秒启动](#3-30-秒启动)
4. [项目结构速览](#4-项目结构速览)
5. [你的第一个 PR](#5-你的第一个-pr)
6. [常用命令速查表](#6-常用命令速查表)
7. [获取帮助](#7-获取帮助)

---

## 1. 你是谁

这份指南为以下两类人编写：

- **学生**：你能写出能跑的函数，做过算法题，但没接触过 CI/CD、代码规范、PR 流程。你觉得「工业级工程」离自己很远。
- **初级开发者**：你有一些项目经验，但代码经常被 review 打回，不确定「为什么这样写不对」。

如果你符合以上任意一条，DevForge 就是为你准备的。这里有一个安全的环境——靶场里故意埋了 bug，CI 会告诉你哪里不对，文档会解释为什么。没有人会因为你在学习中犯错而责怪你。

---

## 2. 环境准备

在开始之前，请确认你的开发环境满足以下要求。

### 必备工具

| 工具 | 版本要求 | 如何安装 | 如何验证 |
|------|----------|----------|----------|
| Node.js | v22 LTS | 访问 [nodejs.org](https://nodejs.org) 下载，或用 nvm/fnm 管理 | \`node -v\` 输出 \`v22.x.x\` |
| npm | 随 Node.js 安装 | 无需单独安装 | \`npm -v\` 输出版本号 |
| git | 任意版本 | macOS 自带，或访问 [git-scm.com](https://git-scm.com) | \`git --version\` |

### 推荐工具

| 工具 | 推荐理由 |
|------|----------|
| VS Code | 免费、轻量、对 React / ESLint 支持好 |
| VS Code ESLint 插件 | 编写代码时实时提示规范问题，不用等 CI |

### 验证环境

打开终端，依次运行以下命令，确认全部有正常输出：

\`\`\`bash
node -v          # 应输出 v22.x.x
npm -v           # 应输出 10.x.x 或更高
git --version    # 应输出 git version 2.x.x
\`\`\`

> 如果你用的是 nvm，确保已切换到 Node 22：\`nvm use 22\`。

---

## 3. 30 秒启动

三条命令，项目就能跑起来。

\`\`\`bash
# 1. 克隆仓库
git clone https://github.com/immaotianyi/devforge.git
cd devforge

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
\`\`\`

终端会显示类似这样的输出：

\`\`\`
  VITE v8.1.1  ready in 312 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
\`\`\`

浏览器打开 \`http://localhost:5173/\`，你就能看到 DevForge 的主页了。

---

## 4. 项目结构速览

DevForge 采用**三类资产模型**，所有内容都在同一个仓库里：

\`\`\`
devforge/
├── .github/      拦截层 — CI 流水线，冷酷地拦截不合规代码
├── docs/         法典层 — 纯 Markdown 文档，耐心解释每条规则
├── src/          源码层 — 脚手架源码 + 靶场实操组件
├── CONTRIBUTING.md
└── README.md
\`\`\`

| 层 | 目录 | 性格 | 职责 |
|----|------|------|------|
| 拦截层 | \`.github/\` | 冷酷监工 | CI 检查代码规范，不通过就标红 PR |
| 法典层 | \`docs/\` | 耐心导师 | 用 Markdown 解释每条规则的为什么和怎么做 |
| 源码层 | \`src/\` | 待检验代码 | 脚手架本体 + 靶场（故意埋了 bug 等你修） |

你的大部分时间会花在 \`src/sandboxes/\` 目录——那里是靶场实操组件，每个靶场都故意保留了一些 React / ESLint 报错，等待你来修复。

想深入了解架构，请阅读 [架构设计文档](./ARCHITECTURE.md)。

---

## 5. 你的第一个 PR

按照以下步骤，完成你的第一次贡献。

### 步骤 1：选择一个靶场

在主页的漏斗导航中，选择 \`软件开发 → 前端工程\`，挑一个难度为 Easy 的靶场，例如「表单验证实战」。点击「打开靶场」。

靶场会显示任务说明和源代码。源代码中故意埋了若干 bug。

### 步骤 2：修复靶场中的 bug

阅读任务说明，找到源代码中的问题。常见问题包括：

- 使用了 \`==\` 而非 \`===\`
- \`useEffect\` 依赖数组遗漏
- 残留的 \`console.log\` 或 \`debugger\`
- 未使用的变量或导入

你也可以直接在本地用编辑器打开对应文件修改：

\`\`\`bash
# 例如修改表单验证靶场
# 用编辑器打开 src/sandboxes/react-patterns/FormValidationSandbox.jsx
\`\`\`

### 步骤 3：本地验证

修改完代码后，运行预检命令确认修复正确：

\`\`\`bash
npm run lint    # 必须无 error
npm run build   # 必须构建成功
\`\`\`

如果 lint 报错，CI 也会报同样的错。请阅读 [代码规范法典](./RULES.md) 查看每条规则的正/误对照。

### 步骤 4：提交代码

\`\`\`bash
# 创建新分支
git checkout -b fix/form-validation-bugs

# 暂存修改
git add src/sandboxes/react-patterns/FormValidationSandbox.jsx

# 提交（遵循 Conventional Commits 规范）
git commit -m "fix: 修复表单验证靶场的 ESLint 报错"
\`\`\`

### 步骤 5：推送并创建 PR

\`\`\`bash
# 推送到你的 fork
git push origin fix/form-validation-bugs
\`\`\`

在 GitHub 上创建 Pull Request，填写 PR 模板中的自检清单。提交后 CI 会自动运行检查。

### 步骤 6：等待 CI 检查

PR 创建后，GitHub Actions 会自动运行 lint + build。如果 CI 标红了：

1. 点击 Checks 标签页查看失败原因。
2. 阅读错误信息中指向 \`docs/RULES.md\` 或 \`docs/CI-CD-GUIDE.md\` 的链接。
3. 本地修复后重新 push。

### 步骤 7：合并

CI 全绿 + 维护者 review 通过后，你的 PR 就可以被合并了。恭喜，你完成了第一次工业级工程协作。

---

## 6. 常用命令速查表

| 命令 | 作用 | 何时使用 |
|------|------|----------|
| \`npm run dev\` | 启动开发服务器（热更新） | 日常开发 |
| \`npm run build\` | 生产构建，输出到 \`dist/\` | 提交前预检 / 发布 |
| \`npm run lint\` | ESLint 代码规范检查 | 提交前预检 |
| \`npm run preview\` | 预览构建产物 | 验证生产环境行为 |

> 记住这条：每次提交前运行 \`npm run lint && npm run build\`，通过后再 push。这是避免 CI 来回报红的最有效方法。

---

## 7. 获取帮助

遇到问题时，按以下顺序查找答案：

1. **CI 爆红了** → 阅读 [CI/CD 排查指南](./CI-CD-GUIDE.md)，5 分钟定位问题。
2. **不知道某条规则为什么存在** → 阅读 [代码规范法典](./RULES.md)，每条规则都有正/误对照。
3. **想了解项目整体设计** → 阅读 [架构设计文档](./ARCHITECTURE.md)。
4. **以上都没解决** → 在 GitHub 上提 Issue，描述你的问题、环境、复现步骤。

> 不要害怕提问。每个资深开发者都曾是新手。提问时描述清楚「你做了什么」「你期望什么」「实际发生了什么」，别人才能帮你。

---

> 准备好了？回到主页，打开一个靶场，开始你的第一个 PR。
`,Fu=`# DevForge AI 工程化规范

> **版本** v1.0.0 · **更新日期** 2026-07-15 · **状态** 正式发布

本文档定义 DevForge 中 AI 相关功能的工程规范，覆盖端侧 AI 助手、多 Agent 编排、API 封装与安全约束。

---

## 目录

1. [范围](#1-范围)
2. [端侧 AI 助手架构](#2-端侧-ai-助手架构)
3. [多 Agent 编排](#3-多-agent-编排)
4. [API 封装规范](#4-api-封装规范)
5. [安全约束](#5-安全约束)

---

## 1. 范围

DevForge 的 AI 工程化能力聚焦于两个方向：

- **端侧 AI (On-Device AI)**：在用户设备（桌面 / 移动端）本地运行大模型，不依赖云端 API，保护隐私、离线可用。
- **多 Agent 架构 (Multi-Agent)**：多个职责单一的 Agent 协作完成复杂任务，通过标准协议通信，支持工具调用 (Tool Calling)。

本文档不涉及模型训练或微调，只关注**推理部署**和**工程封装**层面的规范。

---

## 2. 端侧 AI 助手架构

端侧 AI 助手的目标是：在用户设备上运行本地大模型，提供代码补全、规范检查、靶场提示等能力，全程不离开浏览器。

### 2.1 本地模型加载

模型文件通过浏览器 Cache API 或 IndexedDB 持久化，首次加载后离线可用。

\`\`\`
┌──────────────────────────────────────────────┐
│                  浏览器环境                    │
│                                              │
│  ┌────────────┐    ┌──────────────────────┐  │
│  │ IndexedDB  │───▶│  模型文件缓存         │  │
│  │ (持久存储)  │    │  (.bin / .safetensors)│  │
│  └────────────┘    └──────────┬───────────┘  │
│                               │ 加载到内存    │
│                    ┌──────────▼───────────┐  │
│                    │  WASM / WebGPU 推理   │  │
│                    │  运行时               │  │
│                    └──────────┬───────────┘  │
│                               │              │
│                    ┌──────────▼───────────┐  │
│                    │  AI 助手服务          │  │
│                    │  (流式输出 / 缓存)    │  │
│                    └──────────────────────┘  │
└──────────────────────────────────────────────┘
\`\`\`

**加载规范：**

| 规范 | 要求 | 原因 |
|------|------|------|
| 模型来源 | 必须来自可信 CDN 或本地打包 | 防止模型文件被篡改 |
| 加载进度 | 必须显示加载进度条 | 模型文件较大（数百 MB），用户需要反馈 |
| 离线缓存 | 首次加载后必须可离线使用 | 端侧 AI 的核心价值是离线可用 |
| 版本管理 | 模型版本号必须记录 | 便于排查推理结果差异 |

\`\`\`javascript
// 模型加载示例
async function loadModel(modelId) {
  const cache = await caches.open('ai-models')
  const cached = await cache.match(\`/models/\${modelId}\`)
  if (cached) {
    return await instantiateModel(cached)
  }
  // 首次加载，显示进度
  const response = await fetch(\`/models/\${modelId}\`, { progress: true })
  await cache.put(\`/models/\${modelId}\`, response.clone())
  return await instantiateModel(response)
}
\`\`\`

### 2.2 推理优化

端侧设备的算力和内存有限，推理必须做优化。

| 优化手段 | 说明 | 适用场景 |
|----------|------|----------|
| 量化 (Quantization) | 将模型权重从 FP32 降至 INT8 / INT4 | 内存受限设备 |
| KV Cache | 缓存已计算的注意力键值对 | 流式生成 |
| 批处理 (Batching) | 合并多个短请求为一次推理 | 高并发场景 |
| 懒加载层 (Lazy Layers) | 按需加载 Transformer 层 | 大模型分段加载 |

**推理规范：**

- 推理过程必须在 Web Worker 中运行，不阻塞主线程 UI。
- 推理超时默认 30 秒，超时后中止并提示用户。
- 流式输出优先，让用户尽快看到部分结果。

### 2.3 内存管理

浏览器内存有限（通常 2-4 GB 可用），大模型容易触发 OOM。

\`\`\`javascript
// 内存管理示例
class AIModelSession {
  constructor() {
    this.session = null
    this.memoryUsage = 0
  }

  async init() {
    this.session = await loadModel('default')
    this.memoryUsage = estimateMemory(this.session)
  }

  // 主动释放内存
  dispose() {
    if (this.session) {
      this.session.dispose?.()
      this.session = null
      this.memoryUsage = 0
    }
  }
}
\`\`\`

**内存规范：**

- 模型不使用时必须 \`dispose()\`，不能依赖 GC。
- 单个标签页最多加载一个模型实例。
- 监听 \`visibilitychange\` 事件，页面不可见时释放推理资源。

---

## 3. 多 Agent 编排

复杂任务（如「审查一段代码并给出修复建议」）由多个职责单一的 Agent 协作完成。

### 3.1 Agent 角色

| Agent | 职责 | 输入 | 输出 |
|-------|------|------|------|
| Analyst | 分析用户意图，拆解任务 | 用户原始输入 | 任务计划 |
| Coder | 生成 / 修改代码 | 任务计划 + 代码上下文 | 代码变更 |
| Reviewer | 审查代码变更是否符合规范 | 代码变更 + RULES.md | 审查意见 |
| Executor | 执行代码（沙箱内） | 代码变更 | 运行结果 |
| Reporter | 汇总结果，生成报告 | 各 Agent 输出 | 最终报告 |

### 3.2 通信协议

Agent 之间通过标准消息格式通信，不直接调用彼此内部方法：

\`\`\`typescript
// Agent 间通信消息格式
interface AgentMessage {
  from: string        // 发送方 Agent ID
  to: string          // 接收方 Agent ID
  type: string        // 消息类型：'task' | 'result' | 'error' | 'query'
  payload: unknown    // 消息内容
  traceId: string     // 链路追踪 ID，贯穿整个任务
  timestamp: number   // 发送时间戳
}
\`\`\`

**通信规范：**

- Agent 之间只通过消息通信，不共享可变状态。
- 每条消息必须携带 \`traceId\`，用于全链路追踪。
- 消息处理失败时，必须返回 \`type: 'error'\` 消息，不能静默吞掉。

### 3.3 工具调用 (Tool Calling)

Agent 可以调用外部工具（如代码搜索、lint 检查、文件读取）来增强能力。

\`\`\`javascript
// 工具注册示例
const TOOLS = {
  search_codebase: {
    description: '在代码库中搜索指定模式',
    parameters: { pattern: 'string', scope: 'string' },
    execute: async ({ pattern, scope }) => {
      // 执行搜索逻辑
      return { matches: [] }
    },
  },
  run_lint: {
    description: '对指定文件运行 ESLint',
    parameters: { filePath: 'string' },
    execute: async ({ filePath }) => {
      // 执行 lint 逻辑
      return { errors: [], warnings: [] }
    },
  },
}

// Agent 调用工具时，必须经过用户确认
async function callTool(toolName, params) {
  const confirmed = await requestUserConfirmation(toolName, params)
  if (!confirmed) throw new Error('用户拒绝工具调用')
  return TOOLS[toolName].execute(params)
}
\`\`\`

**工具调用规范：**

- 所有工具调用必须经过用户确认（除非标记为 \`safe: true\`）。
- 工具的输入参数必须经过校验，拒绝非法输入。
- 工具执行超时默认 10 秒。

---

## 4. API 封装规范

当端侧算力不足时，DevForge 支持回退到云端 API。API 封装层必须遵循以下规范。

### 4.1 OpenAI 兼容接口

所有 API 封装必须兼容 OpenAI Chat Completions 接口格式，确保 provider 可切换：

\`\`\`javascript
// 标准请求格式（OpenAI 兼容）
const request = {
  model: 'devforge-default',
  messages: [
    { role: 'system', content: '你是 DevForge 的代码助手' },
    { role: 'user', content: '检查这段代码是否有问题' },
  ],
  temperature: 0.3,
  stream: true,
}

// 统一调用入口
const response = await aiClient.chat.completions.create(request)
\`\`\`

### 4.2 Provider 抽象

通过 Provider 抽象层隔离不同 API 供应商的实现差异：

\`\`\`javascript
// Provider 接口定义
class AIProvider {
  constructor(config) {
    this.name = config.name        // 'openai' | 'anthropic' | 'local'
    this.baseURL = config.baseURL
    this.apiKey = config.apiKey    // 从安全存储读取，不硬编码
  }

  async chat(messages, options = {}) {
    throw new Error('子类必须实现 chat 方法')
  }

  async *stream(messages, options = {}) {
    throw new Error('子类必须实现 stream 方法')
  }
}
\`\`\`

| Provider | 场景 | 特点 |
|----------|------|------|
| \`LocalProvider\` | 端侧推理 | 零延迟、离线可用、隐私安全 |
| \`OpenAIProvider\` | 云端回退 | 模型能力强、需联网、按量计费 |
| \`CustomProvider\` | 自建服务 | 可定制、需自行维护 |

**Provider 切换规范：**

- 默认使用 \`LocalProvider\`，端侧推理。
- 端侧模型加载失败或超时时，自动降级到云端 Provider。
- 降级必须告知用户（Toast 提示），不能静默切换。

### 4.3 错误处理

API 调用必须处理以下错误类型：

| 错误类型 | 表现 | 处理方式 |
|----------|------|----------|
| 网络错误 | \`fetch\` 抛出 TypeError | 重试 1 次，失败后提示用户检查网络 |
| 认证失败 | HTTP 401 | 提示用户检查 API Key，不清除本地缓存 |
| 速率限制 | HTTP 429 | 指数退避重试，最多 3 次 |
| 模型超载 | HTTP 503 | 提示用户稍后重试 |
| 推理超时 | 超过 30 秒无响应 | 中止请求，提示用户简化输入 |

\`\`\`javascript
// 统一错误处理
async function safeChat(provider, messages, options) {
  try {
    return await provider.chat(messages, options)
  } catch (error) {
    if (error.status === 401) {
      throw new AIError('AUTH_FAILED', 'API Key 无效，请检查配置')
    }
    if (error.status === 429) {
      throw new AIError('RATE_LIMITED', '请求过于频繁，请稍后重试')
    }
    if (error.name === 'TimeoutError') {
      throw new AIError('TIMEOUT', '推理超时，请简化输入后重试')
    }
    throw new AIError('UNKNOWN', error.message)
  }
}
\`\`\`

---

## 5. 安全约束

AI 功能涉及模型推理和外部 API 调用，安全是底线。

### 5.1 API Key 管理

| 约束 | 要求 | 原因 |
|------|------|------|
| 禁止硬编码 | API Key 不得出现在任何源码文件中 | 防止泄露到 Git 历史 |
| 本地存储 | API Key 仅存储在 \`localStorage\`，不上传服务端 | 用户自主控制 |
| 环境隔离 | 开发环境的 Key 不得用于生产 | 防止额度消耗 |
| 定期轮换 | 文档中提示用户定期更换 Key | 降低泄露风险 |

\`\`\`javascript
// 正确：从 localStorage 读取
function getApiKey() {
  return localStorage.getItem('ai_api_key')
}

// 错误：硬编码在代码中
const API_KEY = 'sk-xxxxxxxx'  // 绝对禁止
\`\`\`

### 5.2 速率限制

| 限制维度 | 阈值 | 超限行为 |
|----------|------|----------|
| 单用户每分钟 | 20 次请求 | 返回 429，提示稍后重试 |
| 单次会话 | 100 次请求 | 提示用户开启新会话 |
| 单次推理输入 | 8192 tokens | 截断输入并提示 |

### 5.3 输入校验

所有用户输入在送入模型前必须经过校验：

\`\`\`javascript
function validateInput(input) {
  // 1. 长度限制
  if (input.length > 32000) {
    throw new Error('输入过长，请控制在 32000 字符以内')
  }

  // 2. 敏感信息检测
  const sensitivePatterns = [
    /sk-[a-zA-Z0-9]{20,}/,    // API Key
    /\\b\\d{16,}\\b/,             // 信用卡号
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/, // 邮箱
  ]
  for (const pattern of sensitivePatterns) {
    if (pattern.test(input)) {
      throw new Error('输入包含敏感信息，请移除后重试')
    }
  }

  // 3. 注入防护
  if (input.includes('<script') || input.includes('javascript:')) {
    throw new Error('输入包含潜在的注入代码')
  }

  return input
}
\`\`\`

### 5.4 输出过滤

模型输出在展示给用户前必须经过过滤：

- **XSS 防护**：模型输出的 HTML 内容必须经过转义，不允许直接 \`dangerouslySetInnerHTML\`。
- **敏感信息脱敏**：如果输出中包含疑似密钥、 token 的字符串，自动替换为 \`***\`。
- **内容审查**：对模型输出做基本的安全分类，拦截有害内容。

---

> AI 是工具，不是权威。模型给出的建议必须经过人工审查后才能采纳，尤其是涉及代码变更时。
`,Iu={l1:``,l2:``,l3:``},Lu=[{id:`architecture`,title:`架构设计文档`,subtitle:`v1.0.0 · 2026-07-15`,fileName:`ARCHITECTURE.md`,content:ju},{id:`rules`,title:`代码规范法典`,subtitle:`ESLint 逐条解释 · 正/误对照`,fileName:`RULES.md`,content:Mu},{id:`ci-cd-guide`,title:`CI/CD 排查指南`,subtitle:`CI 爆红时的 5 分钟修复手册`,fileName:`CI-CD-GUIDE.md`,content:Nu},{id:`onboarding`,title:`新手上路指南`,subtitle:`第一次参与项目的完整路径`,fileName:`ONBOARDING.md`,content:Pu},{id:`ai-engineering`,title:`AI 工程化规范`,subtitle:`On-device / Multi-Agent`,fileName:`ai-engineering-standard.md`,content:Fu}];function Ru(e){let t=new URLSearchParams;e.l1&&t.set(`l1`,e.l1),e.l2&&t.set(`l2`,e.l2),e.l3&&t.set(`l3`,e.l3),e.sandboxId&&t.set(`sandbox`,e.sandboxId),e.docId&&t.set(`doc`,e.docId);let n=t.toString(),r=n?`#${n}`:window.location.pathname;window.history.replaceState(null,``,r)}function zu(){if(typeof window>`u`)return{...Iu,sandboxId:``,docId:``};let e=window.location.hash.replace(/^#/,``);if(!e)return{...Iu,sandboxId:``,docId:``};let t=new URLSearchParams(e);return{l1:t.get(`l1`)||``,l2:t.get(`l2`)||``,l3:t.get(`l3`)||``,sandboxId:t.get(`sandbox`)||``,docId:t.get(`doc`)||``}}function Bu(){return(0,S.jsxs)(`div`,{className:`sx-sandbox__loading`,children:[(0,S.jsx)(`span`,{className:`sx-sandbox__loading-spinner`,"aria-hidden":`true`}),(0,S.jsx)(`span`,{children:`正在加载靶场实操组件…`})]})}var Vu=class extends b.Component{constructor(e){super(e),this.state={hasError:!1,error:null}}static getDerivedStateFromError(e){return{hasError:!0,error:e}}render(){return this.state.hasError?(0,S.jsxs)(`div`,{className:`sx-sandbox__error`,children:[(0,S.jsx)(`h4`,{children:`靶场组件加载失败`}),(0,S.jsx)(`pre`,{className:`sx-sandbox__error-detail`,children:this.state.error?.message||`未知错误`}),(0,S.jsx)(`p`,{className:`sx-sandbox__error-hint`,children:`该靶场故意保留了若干 React / ESLint 报错,等待贡献者修复。 你可以先关闭靶场,修复代码后再重新打开。`})]}):this.props.children}};function Hu({sandboxId:e}){let t=e?Au(e):null,[n]=(0,b.useState)(()=>t?(0,b.lazy)(t.loadComponent):null);return!t||!n?(0,S.jsxs)(`p`,{className:`sx-sandbox__placeholder`,children:[`未找到 id 为 `,(0,S.jsx)(`code`,{children:e}),` 的靶场。`]}):(0,S.jsx)(Vu,{children:(0,S.jsx)(b.Suspense,{fallback:(0,S.jsx)(Bu,{}),children:(0,S.jsx)(n,{})})})}var Uu=`devforge_progress`;function Wu(){try{let e=localStorage.getItem(Uu);return e?JSON.parse(e):{}}catch{return{}}}function Z(e){try{localStorage.setItem(Uu,JSON.stringify(e))}catch{}}function Gu(){let e=zu(),[t,n]=(0,b.useState)({l1:e.l1,l2:e.l2,l3:e.l3}),[r,i]=(0,b.useState)(e.docId||null),[a,o]=(0,b.useState)(e.sandboxId||null),[s,c]=(0,b.useState)(!1),[l,u]=(0,b.useState)(!1),[d,f]=(0,b.useState)(()=>Wu()),p=(0,b.useRef)(null);(0,b.useEffect)(()=>{Ru({l1:t.l1,l2:t.l2,l3:t.l3,sandboxId:a||``,docId:r||``})},[t,r,a]),(0,b.useEffect)(()=>{function e(e){(e.metaKey||e.ctrlKey)&&e.key===`k`&&(e.preventDefault(),c(e=>!e)),e.key===`Escape`&&c(!1)}return window.addEventListener(`keydown`,e),()=>window.removeEventListener(`keydown`,e)},[]);let m=(0,b.useCallback)((e,t)=>{n(n=>e===1?{l1:t.id,l2:``,l3:``}:e===2?{...n,l2:t.id,l3:``}:{...n,l3:t.id})},[]),h=(0,b.useCallback)(()=>{n({...Iu})},[]),g=(0,b.useCallback)(e=>{if(e){if(e.kind===`sandbox`&&e.sandboxId){o(e.sandboxId),i(null),requestAnimationFrame(()=>{document.getElementById(`sx-sandbox-anchor`)?.scrollIntoView({behavior:`smooth`,block:`start`})});return}if(e.kind===`doc`&&e.docId){i(e.docId),o(null),requestAnimationFrame(()=>{document.getElementById(`sx-doc-viewer`)?.scrollIntoView({behavior:`smooth`,block:`start`})});return}e.href&&window.open(e.href,`_blank`,`noopener,noreferrer`)}},[]),_=(0,b.useCallback)(()=>i(null),[]),v=(0,b.useCallback)(()=>o(null),[]),y=(0,b.useCallback)(e=>{f(t=>{let n={...t,[e]:`Solved`};return Z(n),n})},[]),x=(0,b.useCallback)(async(e,t,n)=>{let r=n.filePath,i=au,a=await fetch(`${nu}/repos/${ru}/${iu}/contents/${r}?ref=${i}`,{headers:{Authorization:`token ${e}`,Accept:`application/vnd.github.v3+json`}});if(!a.ok)throw a.status===401?Error(`GitHub Token 无效,请重新设置`):Error(`获取文件失败: ${a.statusText}`);let o=(await a.json()).sha,s=`sandbox-fix/${n.id}-${Date.now()}`,c=await fetch(`${nu}/repos/${ru}/${iu}/git/refs`,{method:`POST`,headers:{Authorization:`token ${e}`,Accept:`application/vnd.github.v3+json`,"Content-Type":`application/json`},body:JSON.stringify({ref:`refs/heads/${s}`,sha:o})});if(!c.ok)throw Error(`创建分支失败: ${c.statusText}`);let l=await fetch(`${nu}/repos/${ru}/${iu}/contents/${r}`,{method:`PUT`,headers:{Authorization:`token ${e}`,Accept:`application/vnd.github.v3+json`,"Content-Type":`application/json`},body:JSON.stringify({message:t,content:btoa(unescape(encodeURIComponent(n.sourceCode))),branch:s,sha:o})});if(!l.ok)throw Error(`更新文件失败: ${l.statusText}`);let u=await fetch(`${nu}/repos/${ru}/${iu}/pulls`,{method:`POST`,headers:{Authorization:`token ${e}`,Accept:`application/vnd.github.v3+json`,"Content-Type":`application/json`},body:JSON.stringify({title:t,body:`## 靶场修复\n\n- 靶场: ${n.title}\n- 文件: \`${r}\`\n\n---\n\n*此 PR 由 DevForge 靶场自动生成*`,head:s,base:i})});if(!u.ok){let e=await u.json();throw Error(e.message||`创建 PR 失败: ${u.statusText}`)}return(await u.json()).html_url},[]),w=(0,b.useCallback)(e=>{Au(e)&&(o(e),i(null),requestAnimationFrame(()=>{document.getElementById(`sx-sandbox-anchor`)?.scrollIntoView({behavior:`smooth`,block:`start`})}))},[]),E=(0,b.useCallback)(e=>{if(c(!1),e.type===`sandbox`)w(e.id);else if(e.type===`doc`)g({kind:`doc`,docId:e.id});else if(e.type===`nav`){let[t,r]=e.path;n({l1:t,l2:r,l3:``}),requestAnimationFrame(()=>{document.getElementById(`sx-funnel`)?.scrollIntoView({behavior:`smooth`})})}},[w,g]),ee=Lu.find(e=>e.id===r)||null,D=a?Au(a):null,te=G.map(e=>({...e,status:d[e.sandboxId]||e.status}));return(0,S.jsx)(Pl,{children:(0,S.jsxs)(`div`,{className:`sx-app`,children:[(0,S.jsxs)(`main`,{className:`sx-app__main`,children:[(0,S.jsx)(C,{}),(0,S.jsx)(Ql,{sandboxes:G,progress:d}),(0,S.jsx)(`div`,{id:`sx-funnel`,children:(0,S.jsx)(T,{data:ou,selection:t,onSelect:m,onReset:h,onCtaClick:g})}),(0,S.jsx)(Ul,{sandboxes:te,onOpen:w,onMarkSolved:y}),D&&(0,S.jsx)(`div`,{id:`sx-sandbox-anchor`,className:`sx-sandbox-anchor`,children:(0,S.jsx)(zl,{title:D.title,tag:D.tag,filePath:D.filePath,instructionMd:D.instructionMd,sourceCode:D.sourceCode,TargetComponent:()=>(0,S.jsx)(Hu,{sandboxId:D.id}),onClose:v,onSolved:()=>y(D.id),onSubmitPR:async e=>{let t=localStorage.getItem(`github_token`);return t?x(t,e,D):(u(!0),null)}})}),(0,S.jsxs)(`section`,{className:`sx-docs`,"aria-label":`文档中心`,children:[(0,S.jsxs)(`div`,{className:`sx-docs__head`,children:[(0,S.jsx)(`h2`,{className:`sx-docs__title`,children:`文档中心`}),(0,S.jsxs)(`p`,{className:`sx-docs__hint`,children:[`点击下方卡片,通过 `,(0,S.jsx)(`code`,{children:`import xxx from '?raw'`}),` `,`安全加载本地 Markdown 并实时渲染。按`,` `,(0,S.jsx)(`kbd`,{className:`sx-kbd`,children:`⌘K`}),` 打开命令面板快速跳转。`]})]}),(0,S.jsx)(`div`,{className:`sx-docs__grid`,children:Lu.map(e=>(0,S.jsxs)(`button`,{type:`button`,className:[`sx-docs__card`,r===e.id?`is-active`:``].filter(Boolean).join(` `),onClick:()=>g({kind:`doc`,docId:e.id}),children:[(0,S.jsx)(`span`,{className:`sx-docs__card-icon`,"aria-hidden":`true`,children:e.id===`architecture`?`📐`:e.id===`rules`?`📏`:e.id===`ci-cd-guide`?`🤖`:e.id===`onboarding`?`🧭`:`🧠`}),(0,S.jsx)(`span`,{className:`sx-docs__card-title`,children:e.title}),(0,S.jsx)(`span`,{className:`sx-docs__card-sub`,children:e.subtitle}),(0,S.jsx)(`span`,{className:`sx-docs__card-cta`,children:r===e.id?`正在阅读`:`开始阅读 →`})]},e.id))}),(0,S.jsx)(`div`,{id:`sx-doc-viewer`,className:`sx-docs__viewer`,children:ee?(0,S.jsxs)(S.Fragment,{children:[(0,S.jsxs)(`div`,{className:`sx-docs__viewer-bar`,children:[(0,S.jsxs)(`span`,{className:`sx-docs__viewer-path`,children:[`docs/`,ee.fileName]}),(0,S.jsx)(`button`,{type:`button`,className:`sx-docs__close`,onClick:_,children:`✕ 关闭`})]}),(0,S.jsx)(Al,{content:ee.content,title:ee.title,subtitle:ee.subtitle})]}):(0,S.jsx)(`p`,{className:`sx-docs__empty`,children:`尚未选择文档。点击上方任意卡片即可在此处实时渲染。`})})]})]}),(0,S.jsxs)(`footer`,{className:`sx-app__footer`,children:[(0,S.jsx)(`span`,{children:`DevForge · MIT License · v1.0.0`}),(0,S.jsx)(ql,{cta:{kind:`external`,href:`https://github.com/immaotianyi/devforge`,label:`GitHub →`},className:`sx-app__footer-link`})]}),(0,S.jsx)(Zl,{open:s,onClose:()=>c(!1),onSelect:E,sandboxes:G.filter(e=>e.sandboxId),docs:Lu,funnelData:ou,inputRef:p}),(0,S.jsx)(eu,{open:l,onClose:()=>u(!1),onSave:e=>{localStorage.setItem(`github_token`,e),u(!1)}})]})})}(0,x.createRoot)(document.getElementById(`root`)).render((0,S.jsx)(b.StrictMode,{children:(0,S.jsx)(Gu,{})}));export{d as n,y as t};