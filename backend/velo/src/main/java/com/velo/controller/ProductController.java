package com.velo.controller;

import com.velo.entity.ProductEntity;
import com.velo.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/product")
public class ProductController {
    @Autowired
    private ProductService productService;

    @GetMapping("/getall")
     public List<ProductEntity> getAllProduct(){
         return productService.findAllProduct();
     }
    @GetMapping("/getbybrand/{brand}")
     public List<ProductEntity> getAllByBrand(@PathVariable String name){
         return productService.findAllByBrand(name);
     }
    @PostMapping("/create")
     public ProductEntity createProduct(@RequestBody ProductEntity product){
         return productService.createProduct(product);
     }

     @GetMapping("/getbyid/{id}")
    public ProductEntity getProductById(@PathVariable long id){
        return productService.findById(id);
     }

}
