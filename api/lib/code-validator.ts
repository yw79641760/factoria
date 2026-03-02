/**
 * Code Validator - 代码验证器
 * 使用 Babel standalone 在 Node.js 中验证生成的代码
 */

import { transform } from '@babel/standalone';

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  transformedCode?: string;
}

export class CodeValidator {
  /**
   * 验证代码
   */
  async validate(code: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // 预处理：确保代码以正确的格式开始
      let cleanCode = code.trim();

      // 添加 React hooks 解构（如果缺失）
      if (!cleanCode.startsWith('const { useState, useEffect } = React;') &&
          (cleanCode.includes('useState') || cleanCode.includes('useEffect'))) {
        cleanCode = `const { useState, useEffect } = React;\n\n${cleanCode}`;
      }

      // 验证代码是否存在
      if (!cleanCode) {
        errors.push({
          line: 0,
          column: 0,
          message: 'Code is empty',
          severity: 'error'
        });
        return { success: false, errors, warnings };
      }

      // 检查常见问题
      warnings.push(...this.checkCommonIssues(cleanCode));

      // 尝试转换代码
      const transformedCode = transform(cleanCode, {
        presets: ['react'],
        plugins: [
          '@babel/plugin-transform-react-jsx',
          '@babel/plugin-transform-react-remove-proptypes',
          '@babel/plugin-proposal-optional-chaining',
          '@babel/plugin-proposal-nullish-coalescing-operator'
        ],
        filename: 'app.js',
        sourceType: 'module'
      });

      // 检查转换结果
      if (!transformedCode || !transformedCode.code) {
        errors.push({
          line: 0,
          column: 0,
          message: 'Code transformation failed',
          severity: 'error'
        });
        return { success: false, errors, warnings };
      }

      return {
        success: true,
        errors,
        warnings,
        transformedCode: transformedCode.code
      };

    } catch (error: any) {
      // 解析 Babel 错误
      const parseError = this.parseBabelError(error);
      if (parseError) {
        errors.push(parseError);
      } else {
        errors.push({
          line: 0,
          column: 0,
          message: error.message || 'Unknown error',
          severity: 'error'
        });
      }

      return { success: false, errors, warnings };
    }
  }

  /**
   * 检查常见问题
   */
  private checkCommonIssues(code: string): ValidationError[] {
    const issues: ValidationError[] = [];

    // 检查是否使用了危险的 eval
    if (code.includes('eval(')) {
      issues.push({
        line: 0,
        column: 0,
        message: 'Usage of eval() is potentially dangerous',
        severity: 'warning'
      });
    }

    // 检查是否使用了 innerHTML（有 XSS 风险）
    if (code.includes('innerHTML')) {
      issues.push({
        line: 0,
        column: 0,
        message: 'Usage of innerHTML can lead to XSS vulnerabilities',
        severity: 'warning'
      });
    }

    // 检查是否有未使用的变量（简单启发式）
    const stateVars = code.match(/useState\(([^)]+)\)/g);
    if (stateVars) {
      stateVars.forEach(match => {
        const varMatch = match.match(/useState\(([^)]+)\)/);
        if (varMatch) {
          const [varName, setVarName] = varMatch[1].split(',').map(s => s.trim());
          // 检查是否使用了 setState 函数
          if (!code.includes(setVarName)) {
            issues.push({
              line: 0,
              column: 0,
              message: `State setter ${setVarName} is defined but never used`,
              severity: 'warning'
            });
          }
        }
      });
    }

    return issues;
  }

  /**
   * 解析 Babel 错误
   */
  private parseBabelError(error: any): ValidationError | null {
    if (!error) return null;

    const message = error.message || '';
    const loc = error.loc;

    // 提取行号和列号
    let line = 0;
    let column = 0;

    if (loc) {
      line = loc.line || 0;
      column = loc.column || 0;
    } else {
      // 尝试从错误消息中提取
      const lineMatch = message.match(/line (\d+)/);
      const colMatch = message.match(/column (\d+)/);

      if (lineMatch) line = parseInt(lineMatch[1], 10);
      if (colMatch) column = parseInt(colMatch[1], 10);
    }

    // 简化错误消息
    let simplifiedMessage = message;
    
    // 移除常见的 Babel 前缀
    simplifiedMessage = simplifiedMessage
      .replace(/Unexpected token.*?\./, 'Unexpected token')
      .replace(/Missing semicolon.*?\./, 'Missing semicolon')
      .replace(/Unexpected identifier.*?\./, 'Unexpected identifier');

    return {
      line,
      column,
      message: simplifiedMessage,
      severity: 'error'
    };
  }

  /**
   * 验证并修复代码
   */
  async validateAndFix(code: string): Promise<{
    success: boolean;
    code: string;
    errors: ValidationError[];
    warnings: ValidationError[];
    fixes: string[];
  }> {
    const result = await this.validate(code);
    const fixes: string[] = [];
    let fixedCode = code;

    // 尝试自动修复简单错误
    if (!result.success) {
      for (const error of result.errors) {
        const fix = this.attemptFix(fixedCode, error);
        if (fix) {
          fixes.push(fix.message);
          fixedCode = fix.code;
        }
      }

      // 重新验证修复后的代码
      if (fixes.length > 0) {
        const newResult = await this.validate(fixedCode);
        result.success = newResult.success;
        result.errors = newResult.errors;
        result.warnings = newResult.warnings;
      }
    }

    return {
      success: result.success,
      code: fixedCode,
      errors: result.errors,
      warnings: result.warnings,
      fixes
    };
  }

  /**
   * 尝试修复错误
   */
  private attemptFix(code: string, error: ValidationError): { code: string; message: string } | null {
    const lines = code.split('\n');

    if (error.line > 0 && error.line <= lines.length) {
      const line = lines[error.line - 1];
      let fixedLine = line;
      let message = '';

      // 修复缺失的分号
      if (error.message.includes('Missing semicolon')) {
        fixedLine = line.trim() + ';';
        message = `Added missing semicolon on line ${error.line}`;
      }

      // 修复意外的令牌
      if (error.message.includes('Unexpected token')) {
        if (line.trim().endsWith(')') && !line.includes(';')) {
          fixedLine = line.trim() + ';';
          message = `Added missing semicolon on line ${error.line}`;
        }
      }

      if (message) {
        lines[error.line - 1] = fixedLine;
        return {
          code: lines.join('\n'),
          message
        };
      }
    }

    return null;
  }
}
