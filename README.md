```
└── 📁GraphAnalysis //// PFE 2025
    └── 📁Modules
        └── 📁AnalysisModule
            └── 📁Aggregation
                └── aggregation.js
                └── aggregationUtils.js
            └── 📁AnalyseTempSpatiale   /// Contextualization
                └── Barscroll.css
                └── BarScroll.js  /// scroll bar to select node affaire to be showed in graph
                └── ContextManager.js /// the container of the analyze temporal and geospacial
                └── OptionSelections.js  /// filters 
                └── SearchInputComponent.css
            └── 📁AnalysisAlgorithms
                └── Analysis.css
                └── analysis.js   // container + nav bar
                └── Centrality.css
                └── Centrality.js
                └── Community.js
                └── LinkPrediction.js
                └── TopK_Nodes.js
            └── 📁AttributAanalysis
                └── AttributeAnalysis.js
            └── 📁PathDetection
                └── PathInput.js   // select depth + path method  (shortest or path )
                └── pathvisualizationCanvas.js  // pop up window to show the path 
        └── 📁ConfigurationModule // configuration module  handle importation ,show statistics and schemaVisualization
            └── 📁General_statistics
                └── General_statistics.css
                └── General_statistics.js
            └── 📁Importation
                └── Container_SettingsPage.js
                └── Container_Tabs.js
                └── DatabaseContext.js
                └── DatabaseManager.css
                └── DatabaseManager.js /// create database + connect to database
                └── ImportTab.css
                └── ImportTab.js    /// import file json in (must be in apoc.import.json format  visit https://neo4j.com/labs/apoc/4.4/overview/apoc.import/apoc.import.json/)
                └── SettingsPage.css
                └── Summary_Statistics.js
            └── 📁SchemaVisualisation // show the current graph schema + configure the style + add action + add virtual path + add attribute analyze 
                └── Actions.js
                └── AnalysisAttribut.js
                └── cunstructpath.js
                └── Detail.js
                └── NodeConfigForm.js
                └── PathBuilder.js
                └── schema.js
        └── 📁ContainersModules /// this  where All the Module  are combined  , it represent the second lvl after PlatfromAnalysis.js 
            └── ContainerModules.js    graph  interrogation , analyze and visualization
            └── existingvisualization.css
            └── existingvisualization.js  // Etat de sortie !!! 
            └── function_container.js  // utilities used across modules
            └── PathPrameters.js  // global variables between  PathInput.js and  pathvisualizationCanvas.js
        └── 📁InterrogationModule
            └── 📁Details // show the details of node or relation
                └── Details.js
                └── NodeTypeVisibilityControl.js
            └── interrogation.js  // Nav bar to select the interrogation method
            └── 📁LLM  // this the interogation part using the LLM
                └── chat.js
                └── input.js
            └── 📁Oreinted
                └── 📁Extensibilty  /// interact with the node in the canvas
                    └── contextmenucanvas.js
                    └── ContextMenuFunctions.js
                    └── contextmenuRelarion.js
                    └── NodeContextMenu.js
                └── 📁NodeTypeCibled  /// recherche  a node by filing it properties
                    └── CibledInterrogation.js
                    └── NodeTypesRadio.js
                    └── SearchComponent_introgation.js
                └── 📁PredefinedQuestions
                    └── PredefinedQuestions.js
        └── 📁VisualisationModule
            └── globalWindowState.js /// Pop up window controller  to be shown
            └── GraphCanvas.js // this contain NvlVisualization , it prepuce to make plat form independent of bib of visualization
            └── GraphVisualization.js /// This contain GraphCanvas , Layout controller   + minMap + Buttons to save etc ..
            └── 📁layout
                └── layout.js   /// the implementation of some layout
                └── Layoutcontrol.js  /// layout selector in the graph canvas
            └── NvlVisualization.js //// This the canvas of graph visualization
            └── Parser.js    /// Here where the result form the BackEnd are transformed to Nvl graph format
        └── 📁Windows /// Pop up windows
            └── Actions.js
            └── Centrality_Window.js
            └── Community_Window.js
            └── cyphermode.js
            └── Statisics_Window.js
    └── 📁Platforme
        └── PlatfromAnalysis.js // This is the parent component to all project
        └── Urls.js  /// contains the base URL for connecting to the BackEnd + Token
```
