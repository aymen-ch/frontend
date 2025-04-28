import React, { useRef, useEffect, useState } from 'react';
import Draggable from 'react-draggable';
import { ChevronDown, ChevronUp, Eye, EyeOff, Play, Pause, Plus, X, Settings } from 'lucide-react';

const TimelineBar = ({ data, attributes: initialAttributes, setItemsInRange }) => {
  // État pour gérer les attributs de manière dynamique
  const [attributes, setAttributes] = useState(initialAttributes || ['Affaire_date', 'Unite_nom_arabe']);
  const [selectedAttribute, setSelectedAttribute] = useState(attributes[0]); // Default to first attribute
  const [showAttributeManager, setShowAttributeManager] = useState(false);
  const [newAttributeName, setNewAttributeName] = useState('');
  
  // Récupérer tous les attributs disponibles dans les données
  const getAllAvailableAttributes = () => {
    if (!data || data.length === 0) return [];
    
    // Extraire tous les noms d'attributs uniques du premier élément de données
    const firstItem = data[0];
    return Object.keys(firstItem).filter(attr => 
      // Filtrer les attributs qui sont des valeurs primitives (string, number, boolean)
      typeof firstItem[attr] !== 'object' || firstItem[attr] === null
    );
  };
  
  const availableAttributes = getAllAvailableAttributes();
  
  const itemRefs = useRef({});
  const [isVisible, setIsVisible] = useState(true);
  const [boxPosition, setBoxPosition] = useState({ x: 0, width: 100 });
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);
  const resizeStartXPosition = useRef(0);
  const prevItemsInRange = useRef([]);
  
  // Nouveaux états pour le défilement automatique
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(20); // Vitesse de défilement en pixels par intervalle
  const scrollIntervalRef = useRef(null);
  // Nouvel état pour suivre les affaires déjà couvertes
  const coveredItemsRef = useRef(new Set());
  // État pour forcer le rendu des affaires
  const [forceUpdate, setForceUpdate] = useState(0);
  // Référence pour suivre le nombre total d'affaires
  const totalItemsRef = useRef(0);

  useEffect(() => {
    itemRefs.current = {};
    console.log(data);
    // Mettre à jour le nombre total d'affaires
    totalItemsRef.current = data.length;
  }, [data, selectedAttribute]);

  const logItemsInRange = (startX, endX) => {
    if (!timelineRef.current) return [];

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const adjustedStartX = startX + timelineRect.left - scrollLeft;
    const adjustedEndX = endX + timelineRect.left - scrollLeft;

    const itemsInRange = data.filter((item) => {
      const itemElement = itemRefs.current[item.id];
      if (!itemElement) return false;
      const itemRect = itemElement.getBoundingClientRect();
      return itemRect.right - 30 > adjustedStartX && itemRect.left + 30 < adjustedEndX;
    });

    const itemIdsInRange = itemsInRange.map((item) => item.id);
    if (
      itemIdsInRange.length !== prevItemsInRange.current.length ||
      !itemIdsInRange.every((id, index) => id === prevItemsInRange.current[index])
    ) {
      setItemsInRange(itemIdsInRange);
      prevItemsInRange.current = itemIdsInRange;
    }
    
    return itemsInRange;
  };

  useEffect(() => {
    if (data.length > 0 && isVisible) {
      logItemsInRange(boxPosition.x, boxPosition.x + boxPosition.width);
    }
  }, [data, isVisible, selectedAttribute, forceUpdate]);

  useEffect(() => {
    if (!isResizingLeft && !isResizingRight && !isDragging && isVisible) {
      logItemsInRange(boxPosition.x, boxPosition.x + boxPosition.width);
    }
  }, [boxPosition, isResizingLeft, isResizingRight, isDragging, isVisible, forceUpdate]);

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

  // Fonction modifiée pour le défilement automatique
  const startAutoScroll = () => {
    if (isAutoScrolling) return;
  
    setIsAutoScrolling(true);
    
    // Réinitialiser les affaires couvertes au démarrage
    coveredItemsRef.current = new Set();
    
    // Forcer un rendu initial pour s'assurer que tous les éléments sont correctement référencés
    setForceUpdate(prev => prev + 1);
  
    scrollIntervalRef.current = setInterval(() => {
      if (!timelineRef.current) return;
  
      const timelineWidth = timelineRef.current.scrollWidth;
  
      setBoxPosition((prev) => {
        // Au lieu de déplacer la boîte, on augmente sa largeur
        let newWidth = prev.width + scrollSpeed;
        
        // Si la largeur dépasse la timeline, on réinitialise
        if (prev.x + newWidth > timelineWidth) {
          // Réinitialiser à la position initiale et vider les affaires couvertes
          coveredItemsRef.current = new Set();
          setItemsInRange([]);
          return { x: 0, width: 100 };
        }
        
        // Ajuster le défilement du conteneur pour garder la boîte en vue
        const containerRect = timelineRef.current.getBoundingClientRect();
        const boxRightEdge = prev.x + newWidth;
        const visibleRightEdge = timelineRef.current.scrollLeft + containerRect.width;
        
        // Faire défiler vers la droite si le bord droit de la boîte est proche du bord droit visible
        if (boxRightEdge > visibleRightEdge - 50) {
          timelineRef.current.scrollLeft += scrollSpeed;
        }
        
        // Obtenir les éléments actuellement dans la plage
        const currentItems = logItemsInRange(prev.x, prev.x + newWidth);
        
        // Ajouter les nouveaux éléments à l'ensemble des éléments couverts
        currentItems.forEach(item => {
          coveredItemsRef.current.add(item.id);
        });
        
        // Mettre à jour les éléments dans la plage avec tous les éléments couverts jusqu'à présent
        const allCoveredIds = Array.from(coveredItemsRef.current);
        setItemsInRange(allCoveredIds);
        
        // Vérifier si toutes les affaires ont été couvertes
        if (totalItemsRef.current > 0 && coveredItemsRef.current.size >= totalItemsRef.current) {
          // Arrêter le défilement automatique si toutes les affaires sont couvertes
          setTimeout(() => {
            stopAutoScroll();
          }, 500); // Petit délai pour permettre l'affichage final
        }
        
        // Forcer un rendu pour s'assurer que les affaires sont affichées
        setForceUpdate(prev => prev + 1);
        
        return { ...prev, width: newWidth };
      });
    }, 100); // 100ms interval for smooth animation
  };

  // Fonction pour arrêter le défilement automatique
  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    setIsAutoScrolling(false);
    
    // Afficher un message dans la console pour indiquer que toutes les affaires ont été couvertes
    if (coveredItemsRef.current.size >= totalItemsRef.current) {
      console.log("Toutes les affaires ont été couvertes. Défilement automatique arrêté.");
    }
  };

  // Nettoyer l'intervalle lors du démontage du composant
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  // Fonction pour basculer le défilement automatique
  const toggleAutoScroll = () => {
    if (isAutoScrolling) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
  };

  // Fonction pour ajuster la vitesse de défilement
  const handleSpeedChange = (e) => {
    setScrollSpeed(Number(e.target.value));
  };

  const groupItemsByAttribute = (attribute) => {
    return data.reduce((acc, item) => {
      const key = item[attribute] || 'Unknown';
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
  };

  const groupedItems = groupItemsByAttribute(selectedAttribute);
  const keys = Object.keys(groupedItems).sort();

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
    // Arrêter le défilement automatique si on cache la timeline
    if (isAutoScrolling) {
      stopAutoScroll();
    }
  };
  
  // Fonctions pour gérer les attributs
  const addAttribute = () => {
    if (!newAttributeName || attributes.includes(newAttributeName)) return;
    
    setAttributes(prev => [...prev, newAttributeName]);
    setNewAttributeName('');
    setShowAttributeManager(false)
  };
  
  const removeAttribute = (attr) => {
    // Ne pas supprimer si c'est le dernier attribut
    if (attributes.length <= 1) return;
    
    setAttributes(prev => prev.filter(a => a !== attr));
    
    // Si l'attribut supprimé est celui sélectionné, sélectionner le premier attribut restant
    if (selectedAttribute === attr) {
      setSelectedAttribute(attributes.filter(a => a !== attr)[0]);
    }
  };
  
  const toggleAttributeManager = () => {
    setShowAttributeManager(prev => !prev);
  };
  
  // Effet pour afficher les affaires couvertes
  useEffect(() => {
    if (isAutoScrolling) {
      // Forcer un rendu périodique pour s'assurer que les affaires sont affichées
      const updateInterval = setInterval(() => {
        setForceUpdate(prev => prev + 1);
      }, 500);
      
      return () => clearInterval(updateInterval);
    }
  }, [isAutoScrolling]);
  
  return (
    <>
      <div
        ref={timelineRef}
        style={{
          position: 'fixed',
          bottom: '0',
          left: '85px',
          right: '70px',
          height: isVisible ? '200px' : '37px',
          backgroundColor: '#f8f9fa',
          border: '2px solid red',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          padding: isVisible ? '0' : '0',
          zIndex: 1000,
          transition: 'height 0.3s ease',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
          visibility: 'visible',
        }}
      >
        {/* Toggle button moved outside isVisible block */}
        <div style={{ position: 'absolute', top: '5px', right: '10px' }}>
          <button
            onClick={toggleVisibility}
            style={{
              padding: '5px 10px',
              backgroundColor: '#e0e0e0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              zIndex: 1001,
            }}
            title="Masquer/Afficher la timeline"
          >
            {isVisible ? 'Maske' : 'Afficher'}
          </button>
        </div>
  
        {isVisible && (
          <>
            <div style={{ position: 'absolute', top: '5px', left: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Bouton de gestion des attributs */}
              <button
                onClick={toggleAttributeManager}
                style={{
                  padding: '5px 10px',
                  backgroundColor: showAttributeManager ? '#86aae3' : '#e0e0e0',
                  color: showAttributeManager ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Gérer les attributs"
              >
                <Plus size={16} />
              </button>
              
              {/* Boutons d'attributs */}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {attributes.map((attr) => (
                  <div 
                    key={attr} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      backgroundColor: selectedAttribute === attr ? '#86aae3' : '#e0e0e0',
                      color: selectedAttribute === attr ? '#fff' : '#333',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      onClick={() => setSelectedAttribute(attr)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {attr}
                    </button>
                    <button
                      onClick={() => removeAttribute(attr)}
                      style={{
                        padding: '5px',
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        border: 'none',
                        borderLeft: '1px solid rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Supprimer cet attribut"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Contrôles de simulation */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                marginLeft: '20px',
                padding: '5px 10px',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}>
                <button
                  onClick={toggleAutoScroll}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: isAutoScrolling ? '#e74c3c' : '#2ecc71',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                  title={isAutoScrolling ? 'Arrêter la simulation' : 'Démarrer la simulation'}
                >
                  {isAutoScrolling ? <Pause size={16} /> : <Play size={16} />}
                  {isAutoScrolling ? 'Arrêter' : 'Démarrer'}
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <label htmlFor="speed-slider" style={{ fontSize: '12px', color: '#333' }}>
                    Vitesse:
                  </label>
                  <input
                    id="speed-slider"
                    type="range"
                    min="1"
                    max="10"
                    value={scrollSpeed}
                    onChange={handleSpeedChange}
                    style={{ width: '80px' }}
                  />
                  <span style={{ fontSize: '12px', color: '#333', minWidth: '20px' }}>
                    {scrollSpeed}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Gestionnaire d'attributs */}
            {showAttributeManager && (
              <div style={{
                position: 'absolute',
                top: '40px',
                left: '10px',
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                zIndex: 1001,
                width: '500px',
              }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#333' }}>Gestion des attributs</h3>
                
                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                  <select 
                    value={newAttributeName}
                    onChange={(e) => setNewAttributeName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '5px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                    }}
                  >
                    <option value="">Sélectionner un attribut</option>
                    {availableAttributes
                      .filter(attr => !attributes.includes(attr))
                      .map(attr => (
                        <option key={attr} value={attr}>{attr}</option>
                      ))
                    }
                  </select>
                  <button
                    onClick={addAttribute}
                    disabled={!newAttributeName || attributes.includes(newAttributeName)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: !newAttributeName || attributes.includes(newAttributeName) ? '#ccc' : '#2ecc71',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Plus size={14} />
                    Ajouter
                  </button>
                </div>
              </div>
            )}
            
            {/* Timeline content - Préservation de l'affichage horizontal */}
            <div style={{ 
              position: 'relative', 
              height: '100px', 
              minWidth: '100%', 
              marginTop: '60px' // Increased margin-top to add space
            }}>
              {keys.map((key, keyIndex) => (
                <div key={key} style={{ display: 'inline-block', textAlign: 'center', position: 'relative' }}>
                  {keyIndex > 0 && (
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
                    {groupedItems[key].map((item) => (
                      <div
                        key={item.id}
                        ref={(el) => (itemRefs.current[item.id] = el)}
                        style={{
                          display: 'inline-block',
                          width: '100px',
                          textAlign: 'center',
                          position: 'relative',
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
                          {item.type || 'Item'}
                        </div>
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
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 'bold',
                      marginTop: '5px',
                      color: '#ffffff',
                      background: '#a2b1d4',
                      marginLeft: '10px',
                      padding: '5px 10px',
                      borderRadius: '4px',
                    }}
                  >
                    {key}
                  </div>
                </div>
              ))}
  
              <Draggable
                axis="x"
                bounds="parent"
                position={{ x: boxPosition.x, y: 0 }}
                onStart={() => setIsDragging(true)}
                onDrag={(e, data) => {
                  setBoxPosition((prev) => ({ ...prev, x: data.x }));
                }}
                onStop={() => setIsDragging(false)}
                disabled={isAutoScrolling}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '0',
                    height: 'calc(100% - 0px)',
                    width: `${boxPosition.width}px`,
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    border: '2px solid rgba(0, 123, 255, 0.5)',
                    boxSizing: 'border-box',
                    cursor: isAutoScrolling ? 'default' : 'move',
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      width: '10px',
                      height: '100%',
                      cursor: isAutoScrolling ? 'default' : 'w-resize',
                    }}
                    onMouseDown={(e) => !isAutoScrolling && handleResizeStart(e, 'left')}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '0',
                      right: '0',
                      width: '10px',
                      height: '100%',
                      cursor: isAutoScrolling ? 'default' : 'e-resize',
                    }}
                    onMouseDown={(e) => !isAutoScrolling && handleResizeStart(e, 'right')}
                  />
                </div>
              </Draggable>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default TimelineBar;
