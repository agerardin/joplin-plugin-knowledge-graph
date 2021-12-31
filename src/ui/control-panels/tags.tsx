import React, {useState, useEffect} from 'react';
import { WithContext as ReactTags } from 'react-tag-input';
import { TagIndex } from '../model';

import './tags.css'

type PropType = 
{
  suggestions: Map<string, TagIndex>,
  tagSelectionChanged : Function
}

const KeyCodes = {
  comma: 188,
  enter: 13
};
const delimiters = [KeyCodes.comma, KeyCodes.enter];

export const TagsFilter = (props : PropType) => {

  let suggestions = Array.from(props.suggestions.values()).map((tagInfo : TagIndex) => {
    return {
      id: tagInfo.tagNodeId,
      text: `${tagInfo.tagNodeId} (${tagInfo.count})`,
    };
  });

  const [tags, setTags] = useState([]);

  useEffect(() => {
    props.tagSelectionChanged(tags)
  }, [tags]);

  const handleDelete = (i : number) => {
    setTags(tags.filter((_ : any, index : number) => index !== i));
  };

  const handleAddition = (tag : any) => {
    if(!props.suggestions.has(tag.id)) {
      return;
    }
    setTags([...tags, tag]);
  };

  const handleDrag = (tag, currPos, newPos) => {
    const newTags = tags.slice();
    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);
    setTags(newTags);
  };

  const onClearAll = () => {
    setTags([]);
  }

  return (
        <ReactTags
          tags={tags} //selected tags
          suggestions={suggestions} // all possible tags 
          delimiters={delimiters} // keystroke to select tag
          handleDelete={handleDelete}
          handleAddition={handleAddition}
          handleDrag={handleDrag}
          onClearAll={onClearAll}
          inputFieldPosition="top"
          clearAll={true}
          autocomplete={true}
          placeholder='Filter by tags...'
        />
  );
};