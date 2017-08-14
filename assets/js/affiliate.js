// $(document).ready(function(){
//     LeadDyno.key = "e675c09ce3426ec6c8dda67ae18abb234c0179cf";
//     LeadDyno.recordVisit();
//     LeadDyno.autoWatch();
// });

(function() {
  var _fbq = window._fbq || (window._fbq = []);
  if (!_fbq.loaded) {
    var fbds = document.createElement('script');
    fbds.async = true;
    fbds.src = '//connect.facebook.net/en_US/fbds.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(fbds, s);
    _fbq.loaded = true;
  }
})();

$(document).ready(function(){
    window._fbq = window._fbq || [];
    window._fbq.push(['track', '6019153155679', {'value':'0.00','currency':'USD'}]);
});
