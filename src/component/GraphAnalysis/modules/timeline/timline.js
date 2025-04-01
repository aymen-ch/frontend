import React, { useRef, useEffect, useState } from 'react';
import Draggable from 'react-draggable';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

import { useGlobalContext } from '../../GlobalVariables';
const TimelineBar = ({ affaires, setAffairesInRange }) => {
  const affaireRefs = useRef({});
  const [isVisible, setIsVisible] = useState(true);
  const [boxPosition, setBoxPosition] = useState({ x: 0, width: 100 });
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);
  const resizeStartXPosition = useRef(0);
  const prevAffairesInRange = useRef([]);
  const { NewContextHasArrived ,setNewContextHasArrived } = useGlobalContext();

  useEffect(() => {
    affaireRefs.current = {};
  }, [affaires]);

  const logAffairesInRange = (startX, endX, NewContextHasArrived =false) => {
    if (!timelineRef.current) return;
    
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const adjustedStartX = startX + timelineRect.left - scrollLeft;
    const adjustedEndX = endX + timelineRect.left - scrollLeft;

    const affairesInRange = affaires.filter((affaire) => {
      const affaireElement = affaireRefs.current[affaire.id];
      if (!affaireElement) return false;
      const affaireRect = affaireElement.getBoundingClientRect();
      return affaireRect.right - 30 > adjustedStartX && affaireRect.left + 30 < adjustedEndX;
    });

    const affaireIdsInRange = affairesInRange.map((affaire) => affaire.id);
    console.log("NewContextHasArrived33" );
    if(NewContextHasArrived){
      console.log("setAffairesInRange55"  , affaireIdsInRange);
      setAffairesInRange(affaireIdsInRange);
      prevAffairesInRange.current = affaireIdsInRange;
    }
    if (
      affaireIdsInRange.length !== prevAffairesInRange.current.length ||
      !affaireIdsInRange.every((id, index) => id === prevAffairesInRange.current[index]
      )
    ) {
      console.log("setAffairesInRange" );
      setAffairesInRange(affaireIdsInRange);
      prevAffairesInRange.current = affaireIdsInRange;
    }
  };

  useEffect(() => {
    if (affaires.length > 0 ) {
      setBoxPosition({ x: 0, width: 100 });
      
      logAffairesInRange(boxPosition.x, boxPosition.x + boxPosition.width ,NewContextHasArrived);
      console.log("setNewContextHasArrived1" ,NewContextHasArrived);
      setNewContextHasArrived(false);
      console.log("setNewContextHasArrived2" ,NewContextHasArrived);
    }
    if(! isVisible) {
      isVisible =true;
    }
   
  }, [NewContextHasArrived]);


  useEffect(() => {
    if (affaires.length > 0 && isVisible) {
      logAffairesInRange(boxPosition.x, boxPosition.x + boxPosition.width);
    }
  }, [affaires, isVisible]);

  useEffect(() => {
    if (!isResizingLeft && !isResizingRight && !isDragging && isVisible) {
      logAffairesInRange(boxPosition.x, boxPosition.x + boxPosition.width);
    }
  }, [boxPosition, isResizingLeft, isResizingRight, isDragging, isVisible]);

  const handleResizeStart = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    if (direction === 'left') setIsResizingLeft(true);
    if (direction === 'right') setIsResizingRight(true);
    resizeStartX.current = e.clientX + timelineRef.current.scrollLeft;
    resizeStartWidth.current = boxPosition.width;
    resizeStartXPosition.current = boxPosition.x;
  };

  const handleResize = (e) => {
    if (!timelineRef.current) return;
    
    const currentX = e.clientX + timelineRef.current.scrollLeft;
    const deltaX = currentX - resizeStartX.current;
    const timelineWidth = timelineRef.current.scrollWidth;

    if (isResizingLeft) {
      const newX = Math.max(0, resizeStartXPosition.current + deltaX);
      const newWidth = resizeStartWidth.current - deltaX;
      if (newWidth > 20) {
        setBoxPosition({ x: newX, width: newWidth });
      }
    } else if (isResizingRight) {
      const newWidth = Math.min(
        timelineWidth - boxPosition.x,
        Math.max(20, resizeStartWidth.current + deltaX)
      );
      setBoxPosition((prev) => ({ ...prev, width: newWidth }));
    }
  };

  const handleMouseUp = () => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
    setIsDragging(false);
    
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleResize);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  const groupedAffaires = affaires.reduce((acc, affaire) => {
    acc[affaire.date] = acc[affaire.date] || [];
    acc[affaire.date].push(affaire);
    return acc;
  }, {});

  const dates = Object.keys(groupedAffaires).sort();

  const toggleVisibility = () => {
    setIsVisible(prev => !prev);
  };

  return (
    <>
      <div
        ref={timelineRef}
        style={{
          position: 'fixed',
          bottom: '0',
          left: '85px',  // Changed from 0 to 85px
          right: '70px', // Changed from 0 to 70px
          height: isVisible ? '200px' : '24px',
          backgroundColor: '#f8f9fa',
          border: '2px solid red',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          padding: isVisible ? '40px 0 10px' : '0',
          zIndex: 1000,
          transition: 'height 0.3s ease',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
          visibility: isVisible ? 'visible' : 'visible', // Always keep container for toggle button
        }}
      >
        {isVisible && (
          <div style={{ position: 'relative', height: '100px', minWidth: '100%' }}>
            {dates.map((date, dateIndex) => (
              <div key={date} style={{ display: 'inline-block', textAlign: 'center', position: 'relative' }}>
                {dateIndex > 0 && (
                  <div
                    style={{
                      width: '100%',
                      height: '2px',
                      backgroundColor: '#ccc',
                      margin: '20px 0',
                    }}
                  />
                )}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  {groupedAffaires[date].map((affaire) => (
                    <div
                      key={affaire.id}
                      ref={(el) => (affaireRefs.current[affaire.id] = el)}
                      style={{
                        display: 'inline-block',
                        width: '100px',
                        textAlign: 'center',
                        position: 'relative',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>{affaire.type}</div>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#2a5291',
                          margin: '10px auto',
                          transition: 'transform 0.2s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.target.style.transform = 'scale(1.2)')}
                        onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ 
                  fontSize: '15px', 
                  fontWeight: 'bold', 
                  marginTop: '5px', 
                  color: '#ffffff', 
                  background: '#a2b1d4', 
                  marginLeft: '10px', 
                  padding: '5px 10px', 
                  borderRadius: '4px' 
                }}>
                  {date}
                </div>
              </div>
            ))}

            <Draggable
              axis="x"
              bounds={{
                left: 0,
                right: timelineRef.current ? timelineRef.current.scrollWidth - boxPosition.width : 0,
              }}
              position={{ x: boxPosition.x, y: 0 }}
              onDrag={(e, data) => {
                const timelineWidth = timelineRef.current.scrollWidth;
                const newX = Math.min(Math.max(0, data.x), timelineWidth - boxPosition.width);
                setBoxPosition((prev) => ({ ...prev, x: newX }));
                setIsDragging(true);

                const scrollContainer = timelineRef.current;
                const containerRect = scrollContainer.getBoundingClientRect();
                const scrollSpeed = 10;

                if (e.clientX < containerRect.left + 50) {
                  scrollContainer.scrollLeft -= scrollSpeed;
                } else if (e.clientX > containerRect.right - 50) {
                  scrollContainer.scrollLeft += scrollSpeed;
                }
              }}
              onStop={() => {
                setIsDragging(false);
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-10px',
                  width: `${boxPosition.width}px`,
                  height: '110px',
                  backgroundColor: 'rgba(52, 141, 173, 0.3)',
                  border: '2px solid #86aae3',
                  boxShadow: '0 0 5px rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '-5px',
                    top: '0',
                    bottom: '0',
                    width: '10px',
                    cursor: 'ew-resize',
                    backgroundColor: '#86aae3',
                    borderRadius: '2px',
                  }}
                  onMouseDown={(e) => handleResizeStart(e, 'left')}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: '-5px',
                    top: '0',
                    bottom: '0',
                    width: '10px',
                    cursor: 'ew-resize',
                    backgroundColor: '#86aae3',
                    borderRadius: '2px',
                  }}
                  onMouseDown={(e) => handleResizeStart(e, 'right')}
                />
              </div>
            </Draggable>
          </div>
        )}
      </div>

      <div
        style={{
          position: 'fixed',
          right: '10px',
          bottom: '5px',
          display: 'flex',
          gap: '10px',
          zIndex: 1001,
        }}
      >
        <button
          onClick={toggleVisibility}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            position:'relative',
            left:'-30px',
            border: 'none',
            backgroundColor: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 3px rgba(0,0,0,0.1)',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#d0d0d0')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#e0e0e0')}
          title={isVisible ? 'Hide Timeline' : 'Show Timeline'}
        >
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        {(
          <button
            onClick={() => setIsVisible(false)}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              position:'relative',
             
              left:'-30px',
              border: 'none',
              backgroundColor: '#e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 3px rgba(0,0,0,0.1)',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#d0d0d0')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#e0e0e0')}
            title="Collapse Timeline"
          >
            <ChevronDown size={16} />
          </button>
        )}
      </div>
    </>
  );
};

export default TimelineBar;