# scripts/docusaurus/component.py
"""
Base functionality for component processing.
"""

import logging
import re

class ComponentRegistry:
    """Registry for custom components."""
    
    def __init__(self):
        self.components = {}
        self.logger = logging.getLogger("docusaurus.component")
    
    def register(self, name, processor):
        """Register a component processor.
        
        Args:
            name: Component name
            processor: Function to process component
        """
        self.components[name] = processor
        self.logger.info(f"Registered component processor: {name}")
    
    def process_content(self, content):
        """Process content with all registered components.
        
        Args:
            content: Content to process
            
        Returns:
            tuple: (processed_content, imports_list)
        """
        processed_content = content
        imports_list = []
        
        # Process with each registered component
        for name, processor in self.components.items():
            try:
                self.logger.info(f"Processing content with {name} component")
                processed_content, component_imports = processor(processed_content)
                if component_imports:
                    imports_list.extend(component_imports)
            except Exception as e:
                self.logger.error(f"Error processing {name} component: {e}")
        
        return processed_content, imports_list

# Create a global registry
registry = ComponentRegistry()

def register_component(name):
    """Decorator to register a component processor.
    
    Args:
        name: Component name
        
    Returns:
        function: Decorator function
    """
    def decorator(func):
        registry.register(name, func)
        return func
    return decorator

def process_components(content, component_order=None):
    """Process content with all registered components.
    
    Args:
        content: Content to process
        component_order: Optional list of component names to process in a specific order
        
    Returns:
        tuple: (processed_content, imports_list)
    """
    logger = logging.getLogger("docusaurus.component")
    
    if component_order:
        # Process components in the specified order
        processed_content = content
        imports_list = []
        
        for component_name in component_order:
            if component_name in registry.components:
                try:
                    logger.info(f"Processing content with {component_name} component")
                    processor = registry.components[component_name]
                    processed_content, component_imports = processor(processed_content)
                    if component_imports:
                        imports_list.extend(component_imports)
                except Exception as e:
                    logger.error(f"Error processing {component_name} component: {e}")
        
        return processed_content, imports_list
    else:
        # Process with all components without a specific order
        return registry.process_content(content)

def process_components_with_registry(content, component_order=None, processed_dir=None):
    """Process content with all registered components, passing processed_dir for registry access.
    
    Args:
        content: Content to process
        component_order: Optional list of component names to process in a specific order
        processed_dir: Base processed directory for loading media registry
        
    Returns:
        tuple: (processed_content, imports_list)
    """
    logger = logging.getLogger("docusaurus.component")
    
    if component_order:
        # Process components in the specified order
        processed_content = content
        imports_list = []
        
        for component_name in component_order:
            if component_name in registry.components:
                try:
                    logger.info(f"Processing content with {component_name} component")
                    processor = registry.components[component_name]
                    
                    # Check if processor accepts processed_dir parameter
                    import inspect
                    sig = inspect.signature(processor)
                    if 'processed_dir' in sig.parameters:
                        processed_content, component_imports = processor(processed_content, processed_dir=processed_dir)
                    else:
                        processed_content, component_imports = processor(processed_content)
                    
                    if component_imports:
                        imports_list.extend(component_imports)
                except Exception as e:
                    logger.error(f"Error processing {component_name} component: {e}")
        
        return processed_content, imports_list
    else:
        # Process with all components without a specific order
        # Note: This doesn't support processed_dir parameter for now
        return registry.process_content(content)
