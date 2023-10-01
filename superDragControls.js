//类的声明方式 class xxx  extends xxx
//然后用constructor 设置函数变量；

import { Vector2, Raycaster, EventDispatcher, Group} from 'three';
import { DragControls } from './DragControls.js';
import { OrbitControls } from './OrbitControls.js';
import { SelectionBox } from '../interactive/SelectionBox.js';
import { SelectionHelper } from '../interactive/SelectionHelper.js';

let _shiftSelection = false;
let _boxSelectable = false;
let _group;
const mouse = new Vector2(), raycaster = new Raycaster();

class superDragControls extends EventDispatcher {
    constructor( _objects, _camera, _domElement, _scene, _renderer, _damping = true ){
        //orbitControls
        super();
        this.objects = _objects;
        this.camera = _camera;
        this.domElement = _domElement;
        this.damping = _damping;
        this.renderer = _renderer;
        this.scene = _scene;
        this.color = 0x0088ff;
        this.dampingFactor = 0.1;
        _group = new Group();
        this.scene.add( _group );

        
        const scope = this;

        this.orbitControls = new OrbitControls( _camera, _domElement);
        this.orbitControls.update();
        this.orbitControls.dampingFactor = this.dampingFactor;
        this.orbitControls.enableDamping = _damping;
                    
        //dragControls
        this.dragControls = new DragControls( this.objects, this.camera, this.domElement );
        scope.addEventListener('dragstart', function(event){

            scope.orbitControls.enabled = false;
        });
        scope.addEventListener('dragend', function(event){

            scope.orbitControls.enabled = true;
        });

        //SelectionBox 
        const _selectionBox = new SelectionBox( this.camera, this.scene );
        const _helper = new SelectionHelper( this.renderer, 'selectBox' );
        _helper.enabled = false;
    
        _domElement.addEventListener( 'pointerdown', function ( event ) {

            if(!_raytest(event)) return;
            scope.dispatchEvent( { type: 'dragstart' } );
   
            if( !_boxSelectable ){
                for ( const _item of _selectionBox.collection ) {
                    _item.material.emissive.set( 0x000000 );
                }
                return;
            }

            var _groupMember = _group.children;

            console.log(_groupMember);

            for( i = 0; i < fullobjects.length; i++ ){
                scope.scene.attach( _groupMember[i]);
            }
    
            _selectionBox.startPoint.set(
            ( event.clientX / window.innerWidth ) * 2 - 1,
            - ( event.clientY / window.innerHeight ) * 2 + 1,
            0.5 );

        });
    
        scope.domElement.addEventListener( 'pointermove', function ( event ) {
    
/*             if(!_boxSelectable){
                return
            } */
            //scope.orbitControls.enabled = false;
            if ( _helper.isDown && _boxSelectable ) {
                for ( let i = 0; i < _selectionBox.collection.length; i ++ ) {
                    _selectionBox.collection[ i ].material.emissive.set( 0x000000 );
                }
                _selectionBox.endPoint.set(
                ( event.clientX / window.innerWidth ) * 2 - 1,
                - ( event.clientY / window.innerHeight ) * 2 + 1,
                0.5 );
    
                const _allSelected = _selectionBox.select();
                for ( let i = 0; i < _allSelected.length; i ++ ) {
                    _allSelected[ i ].material.emissive.set( scope.color );
                    _group.attach(_allSelected[i]);
                }
            }		
        });
    
        this.domElement.addEventListener( 'pointerup', function ( event ) {
            scope.dispatchEvent( { type: 'dragend' } );
            if(!_boxSelectable)
                return;
            _selectionBox.endPoint.set(
                ( event.clientX / window.innerWidth ) * 2 - 1,
                - ( event.clientY / window.innerHeight ) * 2 + 1,
                0.5 );
            const _allSelected = _selectionBox.select();
            for ( let i = 0; i < _allSelected.length; i ++ ) {
                _allSelected[ i ].material.emissive.set( scope.color );
                _group.attach(_allSelected[i]);
            }
            scope.orbitControls.enabled = true;
        });

        scope.domElement.addEventListener( 'click', _onClick );
        window.addEventListener( 'keydown', _onKeyDown );
        window.addEventListener( 'keyup', _onKeyUp );

        this.dispose = function(){
            this.dragControls.deactivate();

        }

        this.getObjects = function(){
            return this.objects;
        }
        this.update = function(){
            this.orbitControls.update();
        }
        
        function _onKeyDown( event ) {

            scope.orbitControls.enabled = false;
            if(event.keyCode === 17){
                _boxSelectable = true;
                _helper.enabled = true;
            }else if(event.keyCode === 16){
                _shiftSelection = true;
            }
        
        }
        
        function _onKeyUp() {
        
            _shiftSelection = false;
            _boxSelectable =  false;
            //this.orbitControls.enabled = true;
            _helper.enabled = false;
            //scope.dispatchEvent( { type: 'onkeyup' } );
            scope.orbitControls.enabled = true;
        }
        
        function _raytest(event){
            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;  
            raycaster.setFromCamera( mouse, _camera );
            var result = raycaster.intersectObjects( scope.objects, true ).length > 0 ? 1 : null;
            return result;
        }
        
        function _onClick( event ) {
        
            event.preventDefault();        
            if ( _shiftSelection === true ) {
                const draggableObjects = scope.getObjects();


                draggableObjects.length = 0;

                mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
                mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;  
                raycaster.setFromCamera( mouse, _camera );
                const intersections = raycaster.intersectObjects( scope.scene.children, true );
               
                if ( intersections.length > 0) {

                    const _obj = intersections[ 0 ].object;
        
                    if ( _group.children.includes( _obj ) === true ) {
        
                        _obj.material.emissive.set( 0x000000 );
                        scope.scene.attach( _obj );
        
                    } else {
                        _obj.material.emissive.set( scope.color );
                        _group.attach( _obj );
                    }
                    scope.dragControls.transformGroup = true;
                    draggableObjects.push( _group );
        
                }
        
                if ( _group.children.length === 0 ) {      
 
                    scope.dragControls.transformGroup = false;
                    draggableObjects.push( ...scope.scene.children );        
                }
        
            }
        
        }
    }
}

export { superDragControls };






