import React from 'react';
import SlidingPanel from 'react-sliding-side-panel';
import { ControlPanel } from './control-panel';
import Button from '@mui/material/Button';

import 'react-sliding-side-panel/lib/index.css';
import './menu.css';
import { Tag } from 'src/core/tag';


type PropType = {
    suggestions: Map<string, Tag>;
    forceProperties: any;
    allLinks : boolean;
    tagNodes: boolean;
    onlySelected: boolean;
    showAllLinks: Function;
    showTagNodes: Function;
    showOnlySelectedNodes: Function;
    tagSelectionChanged: Function;
    updateForceProperties: Function;
    resetForces: Function;
    openPanel: boolean;
    panelDidClose: Function;
    panelSize: number;
  };
  

const Menu = (props: PropType) => {

  return (
    <div  className='Graph__Menu__container'>
      <SlidingPanel
        type={'right'}
        isOpen={props.openPanel}
        size={props.panelSize}
        noBackdrop={true}
        panelContainerClassName="Graph__Menu__panel_container"
        panelClassName="Graph__Menu__panel-content"
      >
        <div  id="controls" className="Graph__Menu__panel">
              <Button id="Graph__Menu__hide-button" variant="outlined" title='hide controls' size="small" onClick={() => props.panelDidClose()}>
              <i className="fas fa-chevron-right"></i>
              </Button>
            < ControlPanel 
                suggestions={props.suggestions}
                forceProperties={props.forceProperties}
                showAllLinks={props.showAllLinks} 
                showTagNodes={props.showTagNodes}
                showOnlySelectedNodes={props.showOnlySelectedNodes}
                tagSelectionChanged={props.tagSelectionChanged}
                updateForceProperties={props.updateForceProperties}
                resetForces={props.resetForces}
                allLinks={props.allLinks}
                tagNodes={props.tagNodes}
                onlySelected={props.onlySelected}
            />
        </div>
      </SlidingPanel>
    </div>
  );
};

export default Menu;