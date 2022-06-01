import * as React from 'react';
import Dropzone from 'react-dropzone';

const dropzone =  (props: any) => {
    return (
        <div>
        <div className="file-upload-title">File Upload</div>
        <Dropzone style={{'box-sizing': 'border-box', 'width': '387px ', 'height': '181px ', 'background': '#F7F7F7 ', 'border': '1.5px dashed #EBEBEB ', 'border-radius': '5px'}}
        onDrop={() => props.dropFunction.bind(this)}
        >
             <div className="drop-text">
                            <span className="bold-line">Choose file</span>
                            <br />
                            <span className="bold-line">or <br /> drag and drop here  </span>
                            <br />
                            <span className="supported-files"> Supported files: PDF, JPG, Word</span>
                        </div>
        </Dropzone>
        <div className="upload-skip">Skip</div>
    </div>
    );
};

export default dropzone;
