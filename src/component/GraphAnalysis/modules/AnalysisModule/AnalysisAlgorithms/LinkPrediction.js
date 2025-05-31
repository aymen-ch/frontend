import React from 'react';
import axios from 'axios';
import { Button, Spinner } from 'react-bootstrap';
import { BASE_URL_Backend } from '../../../Platforme/Urls';
import { parsergraph} from '../../VisualisationModule/Parser';
import NodeClasificationBackEnd from './NodeClasificationBackEnd/NodeClasificationBackEnd';
import { useTranslation } from 'react-i18next';


const LinkPrediction = ({   }) => {
  

    const{t} = useTranslation()
  return (
    <div className="p-3 d-flex flex-column gap-3">
      
    </div>
  );
};

export default LinkPrediction;