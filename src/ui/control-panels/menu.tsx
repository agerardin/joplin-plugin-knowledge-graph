import React from 'react';
import SlidingPanel from 'react-sliding-side-panel';
import { TagIndex } from '../model';
import { ControlPanel } from './control-panel';
import Button from '@mui/material/Button';

import 'react-sliding-side-panel/lib/index.css';
import './menu.css';


type PropType = {
    suggestions: Map<string, TagIndex>;
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
  };
  

const Menu = (props: PropType) => {
  const [panelSize, setPanelSize] = React.useState<number>(15);

  console.log('open panel', props.openPanel);

  return (
    <div  className='Graph__Menu__container'>
      <SlidingPanel
        type={'right'}
        isOpen={props.openPanel}
        size={panelSize}
        noBackdrop={true}
        panelContainerClassName="Graph__Menu__panel_container"
        panelClassName="Graph__Menu__panel-content"
      >
        <div  id="controls" className="Graph__Menu__panel">
            <div>
              <Button variant="outlined" size="small" onClick={() => props.panelDidClose()}> Hide Controls</Button>
            </div>
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


// const Menu = (props: PropType) => {
//     const [openPanel, setOpenPanel] = useState(false);
//     const [panelSize, setPanelSize] = React.useState<number>(15);
//     return (
//         <div>
//                         <div className="Graph__Menu__toggle">
//                   <button onClick={() => setOpenPanel(true)}>Controls</button>
//               </div>
//           <div className="Graph__Menu__container">
  
//               <SlidingPanel
//                   type={"right"}
//                   isOpen={openPanel}
//                   size={panelSize}
//                   noBackdrop={true}
//                   panelClassName="sliding-menu">
//                       <div id="controls" className="Graph__panel">
//                           <div className='Graph__Menu__toggle'>
//                               <button onClick={() => setOpenPanel(false)}>close</button>
//                           </div>
//                           <ControlPanel
//                               suggestions={props.suggestions}
//                               forceProperties={props.forceProperties}
//                               showAllLinks={props.showAllLinks}
//                               showTagNodes={props.showTagNodes}
//                               showOnlySelectedNodes={props.showOnlySelectedNodes}
//                               tagSelectionChanged={props.tagSelectionChanged}
//                               updateForceProperties={props.updateForceProperties}
//                               resetForces={props.resetForces}
//                           />
//                       </div>
//               </SlidingPanel>
//           </div>
//       </div>
//     );
//   };
  
//   export default Menu;