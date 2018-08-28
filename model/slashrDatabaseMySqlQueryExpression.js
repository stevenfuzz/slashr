const slashrDatabaseQueryExpression = require("./slashrDatabaseQueryExpression");
const slashrDatabaseQuery = require("./slashrDatabaseQuery");
module.exports = class slashrDatabaseMySqlQueryExpression extends slashrDatabaseQueryExpression{
	constructor(database){
		super(database);
		let self = this;
		//TODO: Remove global, use Slashr.utils instead 
		let utils = global.slashr.utils();
		return new Proxy(this, {
			getPrototypeOf(target) {
				return slashrDatabaseMySqlQueryExpression.prototype;
			},
			get : function(obj, prop){
				console.log("PROP PROP PROP",prop, JSON.stringify(prop));
				if(self[prop]) return self[prop];
				prop = prop.trim().lowercase();

				if (prop === 'or' || prop === 'and' || prop === 'if'){
					return self[`${prop}X`];
				}
				else if(prop.startsWith("or")){
					let fn = utils.str.toCamelCase(prop.substring(2));
					return (...args) => {self.or(
							self.db.exp[fn](...args)
						);
					}
					// return $this->or(call_user_func_array([$this->db->qry->exp,$fn], $arguments));
				}
				else if(prop.startsWith("or")){
					let fn = utils.str.toCamelCase(prop.substring(3));
					return (...args) => {self.or(
							self.db.exp[fn](...args)
						);
					}
					// return call_user_func_array([$this,$fn], $arguments);
				}
				else{
					throw (`slashrDatabaseQueryExpressionSqlAdapter method '${prop}' not found.`);
				}

				return "";
			},
			apply: function(obj, context, args){
				throw("slashrDatabaseMySqlQueryExpression apply error");
			}
		});
	}
// PROXY
//	final public __call($name, $arguments){
//		$utils = blr::utils();
//		$name = strtolower(trim($name));
//		if ($name == 'or' || $name == 'and' || $name == 'if'){
//			$fn = "{$name}X";
//			return call_user_func_array([$this,$fn], $arguments);
//		}
//		else if($utils->string->startsWith($name,"or")){
//			$fn = $utils->string->toCamelCase(substr($name, 2));
//			return $this->or(call_user_func_array([$this->db->qry->exp,$fn], $arguments));
//		}
//		else if($utils->string->startsWith($name,"and")){
//			$fn = $utils->string->toCamelCase(substr($name, 3));
//			return call_user_func_array([$this,$fn], $arguments);
//		}
//		else{
//			throw ("blrDatabaseQueryExpressionSqlAdapter method '{$name}' not found.");
//		}
//	}

	// orX and andX use __call for or / and
//	abstract orX(expression);
//	abstract andX(expression);
//	abstract equals(x,y);
//	abstract notEquals(x,y);
//	abstract lessThan(x,y);
//	abstract lessThanOrEquals(x,y);
//	abstract greaterThan(x,y);
//	abstract greaterThanOrEquals(x,y);
//	abstract in(x,y);
//	abstract notIn(x,y);
//	abstract exists(x);
//	abstract notExists(x);
//	abstract isNull(x);
//	abstract isNotNull(x);
//	abstract like(x,y);
//	abstract notLike(x,y);
//	
//	abstract min(x);
//	abstract max(x);
//	abstract count(x);
//	abstract countDistinct(x);
//	abstract ifX(x, y, z);
	
	// Abbrs
	eq(x,y){return this.equals(x,y);}
	neq(x,y){return this.notEquals(x,y);}
	lt(x,y){return this.lessThan(x,y);}
	lte(x,y){return this.lessThanOrEqual(x,y);}
	gt(x,y){return this.greaterThan(x,y);}
	gte(x,y){return this.greaterThanOrEquals(x,y);}
	nin(x,y){return this.notIn(x,y);}
	ex(x){return this.exists(x);}
	nex(x){return this.notExists(x);}
	
	nl(x){return this.isNull(x);}
	nnl(x){return this.isNotNull(x);}
	lk(x){return this.like(x);}
	nlk(x){return this.notLike(x);}
	
	orX(expression){
		return this.andOrX("or", expression);
	}

	andX(expression){
		return this.andOrX("and", expression);
	}
	_andOrX(condition, expression){
		let expStr = "";
		if(expression instanceof slashrDatabaseQueryExpression){
			expStr = expression.toString();
			if(expression.getExpressionCount() > 1) expStr = "("+expStr+")";
		}
		else if(expression instanceof 'string'){
			expStr = expression;
		}
		else throw("Query Expression '{condition}' error: Must be expression or string");
		this.addPart(expStr, condition);
		return this;
	}

	equals(x,y){
		this.addPart(x+" = "+y);
		return this;
	}

	notEquals(x,y){
		this.addPart(x+" != "+y);
		return this;
	}

	lessThan(x, y){
		this.addPart(x+" < "+y);
		return this;
	}

	lessThanOrEquals(x, y){
		this.addPart(x+" <= "+y);
		return this;
	}

	greaterThan(x, y){
		this.addPart(x+" > "+y);
		return this;
	}

	greaterThanOrEquals(x, y){
		this.addPart(x+" >= "+y);
		return this;
	}
	in(x, y){
		return this._inNotIn("IN", x, y);
	}
	notIn(x, y){
		return this._inNotIn("NOT IN", x, y);
	}
	_inNotIn(condition, x, y){
		let expStr = y;
		if(y instanceof slashrDatabaseQuery) expStr = y.toString();
		else if(Array.isArray(y)){
			for(let i in y){
				if(isNaN(y[i])) y[i] = "'"+val+"'";
			}
			expStr = y.join(",");
		}
		if(typeof expStr !== "string") throw("value for {condition} must be either string / array / or expression.");
		this.addPart(x+" "+condition+" ("+expStr+")");
		return this;
	}
	exists(x){
		return this._existsNotExists("EXISTS", x);
	}
	notExists(x){
		return this._existsNotExists("NOT EXISTS", x);
	}
	_existsNotExists(condition, x){
		let expStr = x;
		if(x instanceof "blrDatabaseQuery") expStr = x.toString();
		else if(x instanceof 'array') die("not implemented");
		if(expStr instanceof 'string') throw ("value for "+condition+" must be either string / array / or expression.");
		this.addPart(condition+" ("+expStr+")");
		return this;
	}
	isNull(x){
		this.addPart(x+" IS NULL");
		return this;
	}
	isNotNull(x){
		this.addPart(x+" IS NOT NULL");
		return this;
	}

	like(x, y){
		this.addPart(x+" LIKE "+y);
		return this;
	}

	notLike(x, y){
		this.addPart(x+" NOT LIKE "+y);
		return this;
	}

	ifX(x, y, z){
		if(x instanceof "blrDatabaseQueryExpression"){
			x = x.toString();
		}
		else if(x instanceof 'string'){
			x = x;
		}
		if(! is_string(x)) throw ("contition value for mySql IF() must be either string or expression.");

		return "IF("+x+","+y+","+z+")";
	}

	min(x){throw("not implemented");}
	max(x){throw("not implemented");}
	count(x){throw("not implemented");}
	countDistinct(x){throw("not implemented");}

	toString(options = {}){
		let retStr = "";
		let i = 1;
		for(let p in this.parts){
			let part = this.parts[p];
			if(p > 0) retStr += (part.type === "or") ? " OR " : " AND ";
			retStr += part.expression;
		}
		return retStr;
	}
	
}