
function variable_schema(variable, schema) {
  for (var i = 0; i < schema.fields.length; i++) {
    if (schema.fields[i].name == variable) 
      return schema.fields[i];
  }
  return undefined;
}

function variable_value_formatter(variable, schema){
	for (var i = 0; i < schema.fields.length; i++){
		var field = schema.fields[i];
	    if (field.name == variable){
			switch(field.type){
				case "number":{
					return number_formatter(field);
				}
				case "categorical":{
					return categorical_formatter(field);
				}
				case "string":{
					return categorical_formatter(field);
				}				
				default:{
					return default_formatter(field);
				}
			}
	    }
	}
	return default_formatter();
}
// creates a formatter for pretty printing values for a specific field 
function value_formatter(schema){
	var formatters = {};
	for (var i = 0; i < schema.fields.length; i++){
		var field = schema.fields[i];
		switch(field.type){
			case "number":{
				formatters[field.name] = number_formatter(field);
				break;
			}
			case "categorical":{
				formatters[field.name] = categorical_formatter(field);
				break;
			}
			case "string":{
				formatters[field.name] = categorical_formatter(field);
				break;
			}
			default:{
				formatters[field.name] = default_formatter(field);
			}
		}
	}

	return function(datum, name){
		return formatters[name](datum[name]);
	};
}

function default_formatter(field){
	return function(value){
		return value;
	};
}

function categorical_formatter(field){
	var cat_titles = {};
	for (var i = 0; i < field.categories.length; i++){
		var cat = field.categories[i];
		cat_titles[cat.name] = cat.title || cat.name;
	}
	return function(value){
		return cat_titles[value];
	};
}

function number_formatter(field){
	//TODO use rounding?
	return function(value){
		return value.toString();
	};
}
