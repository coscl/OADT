/**
 * 
 *
 */

var TableManageView=Backbone.View.extend({
	el:'body',
	options:{
		parentEl:null,	//specify the root element where display the datagrid
		code:false,	//specify whether to display the number column
		checkbox:false,	//specify whether to display the checkbox column
		columns : [],	//specify the content of the datagrid
		emptyContent : 'no entries', //specify the prompt message if there is no data
		onItemClick : Backbone.UI.noop,
		sortable : false,
		onSort : null,
		itemView : null,
		onItemClick : Backbone.UI.noop,
		maxHeight : null,
		url:null,
		pagerModel:new PagerModel()	//used to storage pager information
	},
	tableView:null,	//refer to datagrid component
	pagerView:null,	//refer to pager component
	
	initialize:function(){
		//if need to display pager component, initialize pagerModel
		if(this.options.pager){
			this.options.pagerModel.set({
				url:this.options.url,
				pageNo:this.options.pager.pageNo,
				pageSize:this.options.pager.pageSize,
				pageList:this.options.pager.pageList,
				parentEl:this.options.parentEl
			})
		}
		
		//create a parent element
		$(this.options.parentEl).wrap("<div class='cs2c_datagrid'></div>");
		
		if(this.tableView){
			this.tableView.undelegateEvents();
		}
		
		//initialize tableView and pagerView with options
		this.tableView=new DatagridView(this.options);		
		if(this.options.pager){			
			this.pagerView=new PagerView(this.options.pagerModel);
		}
		
	},
	
	events:{
		//define events handling of pagerView
		"click .datagrid_pager a.clickabled" : "doPage",	
		'change select[class="pager_list"]':"autoRefresh"	
	},
	
	//call dopage() of pagerView to reset pager information
	doPage: function(e){
			this.pagerView.doPage(e);
			if(this.options.pagination){
				//根据pagerModel重新获取数据，重置this.allModels
				
			}
			this.tableView.refreshDataGrid();
			this.tableView.setCollection();
			if($(".pager_loading")){
				$(".pager_loading").removeClass("pager_loading") ;
			}
		
	},
	
	//call autoRefresh() of pagerView to refresh automatically 
	autoRefresh:function(){
			this.pagerView.autoRefresh();
			if(this.options.pagination){
				//根据pagerModel重新获取数据，重置this.allModels
			}
			this.tableView.setCollection();
	}
    
})