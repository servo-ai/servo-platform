// create a b3 namespace
var b3 = [];
/**
 * 
 */
b3.createUUID = function () {
  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  // bits 12-15 of the time_hi_and_version field to 0010
  s[14] = "4";

  // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);

  s[8] = s[13] = s[18] = s[23] = "-";

  var uuid = s.join("");
  return uuid;
}

<%for (var i=0;i<nodes.length;i++) { %>
b3.push({
  name: "<%=nodes[i].name%>",
  title: "<%=nodes[i].title%>",
  parameters: <%=JSON.stringify(nodes[i].parameters)%>,
  description: "<%=nodes[i].description%>",
  id: "<%=nodes[i].id%>",
  category: "<%=nodes[i].category%>",
  validators: (function <%=nodes[i].validators.toString()%>)
});
<%}%>
