L.SpectrumSpatial.Services.Operation = L.Class.extend(
/** @lends L.SpectrumSpatial.Services.Operation.prototype */
{ 

    /**
    * Operation's options class
    * @typedef {Object}  L.SpectrumSpatial.Services.Operation.Options
    * @property {string} name Name of operation
    * @property {Object} getParams Params for get request
    * @property {Object} postParams Params for post request
    * @property {boolean} forcePost Is true if opertaion should use post request
    * @property {string} paramsSeparator Separator for get params in url
    * @property {string} queryStartCharacter Character from which query begins 
    * @property {string} postType Type of post data. Default is 'application/json'
    * @property {string} responseType Type of response data. Used for post response with image (only for XHR2)
    */


    options: {
        forcePost :false,
        paramsSeparator: ';',
        queryStartCharacter:';',
        postType : 'application/json',
        responseType:null
    },

    /**
    * @class Service operation class
    * @augments {L.Class} 
    * @constructs L.SpectrumSpatial.Services.Operation
    * @param {string} name Name of operation
    * @param {L.SpectrumSpatial.Services.Operation.Options} options Additional options of operation
    */
    initialize: function(name,options) {
        this.options.getParams = {};
        this.options.postParams = {};
        options = options || {};
        options.name=name;
        L.setOptions(this, options);
    },
  
    /**
    * Builds query for url by name and getParams of operation
    * @returns {string}
    */
    getUrlQuery: function(){     
        var keyValueArray = [];
        var params =  this.options.getParams;   
        for (var key in params){
            if(params.hasOwnProperty(key)){
                var param = params[key];      
                keyValueArray.push(key + '=' + encodeURIComponent(param));
            }
        }
        var query = this.options.name;
        
        if (keyValueArray.length>0){
            query+=this.options.queryStartCharacter + keyValueArray.join(this.options.paramsSeparator);
        }
        
        return query;
    },

  
    /**
    * Creates string representation of postParams
    * @returns {string}
    */
    getPostData: function(){
        return JSON.stringify(this.options.postParams);
    },
    
    /**
    * Returns type of post data
    * @returns {string}
    */
    getPostType: function(){
        return this.options.postType;
    },
    
    /**
    * Returns type of response type (for xhr 2)
    * @returns {string}
    */
    getResponseType: function(){
        return this.options.responseType;
    },
    
    /**
    * Check if operation should use only post request
    * @returns {boolean}
    */
    isPostOperation:function(){
        return (Object.keys(this.options.postParams).length!==0) | this.options.forcePost;
    }
    
});

L.SpectrumSpatial.Services.operation = function(name,options){
    return new L.SpectrumSpatial.Services.Operation(name,options);
};